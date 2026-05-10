import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Options = {
  scoutId?: string;
  country: string;
  areaCode?: string;
  phoneNumber?: string;
  dryRun: boolean;
  testMode: boolean;
  twilioSid?: string;
  help: boolean;
};

type TwilioAvailablePhoneNumber = {
  phone_number: string;
};

type TwilioAvailableResponse = {
  available_phone_numbers?: TwilioAvailablePhoneNumber[];
};

type TwilioIncomingNumberResponse = {
  sid?: string;
  phone_number?: string;
};

loadDotEnv();

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

if (!options.scoutId) {
  fail("Missing --scout-id. Use --agent-id as an alias only for legacy issue wording.");
}

if (options.dryRun) {
  printJson({
    mode: "dry-run",
    scoutId: options.scoutId,
    country: options.country,
    areaCode: options.areaCode ?? null,
    phoneNumber: options.phoneNumber ?? null,
    testMode: options.testMode,
    wouldCallTwilio: !options.testMode,
    wouldPersistField: "Scout.twilioSid",
  });
  process.exit(0);
}

main(options).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
});

async function main(options: Options): Promise<void> {
  assertProductDatabaseUrl();

  const { prisma } = await import("../packages/db/src/index");

  try {
    const sid = options.testMode
      ? await provisionTestNumber(options)
      : await provisionTwilioNumber(options);

    const scout = await prisma.scout.findUnique({
      where: { id: options.scoutId },
      select: { id: true, name: true, twilioSid: true },
    });

    if (!scout) {
      fail(`Scout not found: ${options.scoutId}`);
    }

    await prisma.scout.update({
      where: { id: scout.id },
      data: { twilioSid: sid },
    });

    printJson({
      mode: options.testMode ? "test" : "live",
      scoutId: scout.id,
      scoutName: scout.name,
      previousTwilioSid: scout.twilioSid ?? null,
      twilioSid: sid,
      persisted: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function provisionTestNumber(options: Options): Promise<string> {
  return options.twilioSid ?? process.env.TWILIO_TEST_NUMBER_SID ?? makeTestSid(options.scoutId!);
}

async function provisionTwilioNumber(options: Options): Promise<string> {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const phoneNumber =
    options.phoneNumber ?? (await findAvailablePhoneNumber(accountSid, authToken, options));

  const form = new URLSearchParams({
    PhoneNumber: phoneNumber,
    FriendlyName: `Personal Industry Scout ${options.scoutId}`,
  });

  if (process.env.TWILIO_SMS_WEBHOOK_URL) {
    form.set("SmsUrl", process.env.TWILIO_SMS_WEBHOOK_URL);
  }

  if (process.env.TWILIO_VOICE_WEBHOOK_URL) {
    form.set("VoiceUrl", process.env.TWILIO_VOICE_WEBHOOK_URL);
  }

  const response = await twilioRequest<TwilioIncomingNumberResponse>(
    accountSid,
    authToken,
    `/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.sid) {
    throw new Error("Twilio did not return an incoming phone number SID.");
  }

  return response.sid;
}

async function findAvailablePhoneNumber(
  accountSid: string,
  authToken: string,
  options: Options,
): Promise<string> {
  const params = new URLSearchParams({
    SmsEnabled: "true",
    VoiceEnabled: "true",
    PageSize: "1",
  });

  if (options.areaCode) {
    params.set("AreaCode", options.areaCode);
  }

  const response = await twilioRequest<TwilioAvailableResponse>(
    accountSid,
    authToken,
    `/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${options.country}/Local.json?${params}`,
  );

  const [candidate] = response.available_phone_numbers ?? [];
  if (!candidate?.phone_number) {
    throw new Error(`No Twilio numbers available for country=${options.country} areaCode=${options.areaCode ?? "any"}.`);
  }

  return candidate.phone_number;
}

async function twilioRequest<T>(
  accountSid: string,
  authToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.twilio.com${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...init.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = typeof body.message === "string" ? body.message : text || response.statusText;
    throw new Error(`Twilio ${response.status}: ${message}`);
  }

  return body as T;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    scoutId: process.env.SCOUT_ID ?? process.env.AGENT_ID,
    country: process.env.TWILIO_PROVISION_COUNTRY ?? "US",
    areaCode: process.env.TWILIO_PROVISION_AREA_CODE || undefined,
    phoneNumber: process.env.TWILIO_PROVISION_PHONE_NUMBER || undefined,
    dryRun: false,
    testMode: process.env.TWILIO_PROVISION_TEST_MODE === "true" || process.env.TWILIO_TEST_MODE === "true",
    twilioSid: process.env.TWILIO_TEST_NUMBER_SID || undefined,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    const next = () => {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        fail(`Missing value for ${arg}.`);
      }
      index += 1;
      return value;
    };

    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--scout-id" || arg === "--agent-id") options.scoutId = next();
    else if (arg === "--country") options.country = next();
    else if (arg === "--area-code") options.areaCode = next();
    else if (arg === "--phone-number") options.phoneNumber = next();
    else if (arg === "--twilio-sid") options.twilioSid = next();
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--test-mode") options.testMode = true;
    else if (arg === "--live") options.testMode = false;
    else fail(`Unknown option: ${arg}`);
  }

  return options;
}

function loadDotEnv(): void {
  const path = resolve(process.cwd(), ".env");
  if (existsSync(path)) {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      const raw = trimmed.slice(equalsIndex + 1).trim();
      if (!shouldLoadDotEnvKey(key)) continue;

      process.env[key] = raw.replace(/^['"]|['"]$/g, "");
    }
  }

  if (process.env.PIS_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.PIS_DATABASE_URL;
  }
}

function shouldLoadDotEnvKey(key: string): boolean {
  if (process.env[key] === undefined) return true;

  const isPaperclipRun = Boolean(process.env.PAPERCLIP_RUN_ID);
  const isPaperclipDb =
    key === "DATABASE_URL" &&
    /(^|[/@])paperclip([/?#]|$)/.test(process.env.DATABASE_URL ?? "");

  return isPaperclipRun && isPaperclipDb;
}

function assertProductDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPaperclipRun = Boolean(process.env.PAPERCLIP_RUN_ID);
  const isPaperclipDb = /(^|[/@])paperclip([/?#]|$)/.test(databaseUrl);

  if (isPaperclipRun && isPaperclipDb) {
    fail("DATABASE_URL points at the Paperclip control database. Set PIS_DATABASE_URL or run from the product deployment env.");
  }
}

function makeTestSid(scoutId: string): string {
  return `PN${createHash("sha256").update(`pis:${scoutId}`).digest("hex").slice(0, 32)}`;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function printUsage(): void {
  console.log(`Usage: pnpm provision:number -- --scout-id <uuid> [options]

Options:
  --dry-run                 Print intended action without calling Twilio or writing the DB.
  --test-mode               Persist a deterministic test Twilio SID without a Twilio API call.
  --live                    Force live Twilio API mode.
  --country <code>          Twilio country code for number search. Defaults to US.
  --area-code <code>        Optional local area code for search.
  --phone-number <number>   Buy this exact Twilio number instead of searching.
  --twilio-sid <sid>        Test-mode SID to persist.
  --agent-id <uuid>         Alias for --scout-id.
`);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message: string): never {
  console.error(`[provision-number] ${message}`);
  process.exit(1);
}
