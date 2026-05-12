const POSTMARK_API = "https://api.postmarkapp.com";

export interface SendEmailParams {
  to: string;
  templateAlias: "intake-link" | "weekly-brief";
  templateModel: Record<string, string>;
  messageStream?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60_000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const token = process.env.POSTMARK_SERVER_TOKEN;

  if (!token) {
    const error = "POSTMARK_SERVER_TOKEN is not set — emails will not be delivered";
    console.warn(`── Postmark stub (WARNING) ──`);
    console.warn(`  ${error}`);
    console.warn(`  To:       ${params.to}`);
    console.warn(`  Template: ${params.templateAlias}`);
    console.warn(`  Stream:   ${params.messageStream || "outbound"}`);
    console.warn(`  Model:    ${JSON.stringify(params.templateModel)}`);
    console.warn(`── End stub ──`);
    return { ok: false, error };
  }

  const body = {
    From: "Personal Industry Scout <brief@personalindustryscout.com>",
    To: params.to,
    TemplateAlias: params.templateAlias,
    TemplateModel: params.templateModel,
    MessageStream: params.messageStream || "outbound",
  };

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${POSTMARK_API}/email/withTemplate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": token,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, messageId: data.MessageID };
      }

      if (res.status >= 400 && res.status < 500) {
        const data = await res.json();
        return { ok: false, error: `Postmark 4xx: ${data.Message || res.statusText}` };
      }

      const data = await res.json();
      lastError = `Postmark 5xx (attempt ${attempt}/${MAX_RETRIES}): ${data.Message || res.statusText}`;
      console.warn(lastError);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    } catch (err) {
      lastError = `Postmark fetch error (attempt ${attempt}/${MAX_RETRIES}): ${err instanceof Error ? err.message : String(err)}`;
      console.warn(lastError);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  return { ok: false, error: lastError };
}

export async function sendIntakeLink(
  to: string,
  intakeUrl: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    templateAlias: "intake-link",
    templateModel: {
      intake_url: intakeUrl,
      product_name: "Personal Industry Scout",
    },
    messageStream: "outbound",
  });
}

export async function sendWeeklyBrief(
  to: string,
  pdfUrl: string,
  industry: string,
  weekLabel: string,
  scoutName: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    templateAlias: "weekly-brief",
    templateModel: {
      pdf_url: pdfUrl,
      industry,
      week_label: weekLabel,
      scout_name: scoutName,
      product_name: "Personal Industry Scout",
    },
    messageStream: "outbound",
  });
}
