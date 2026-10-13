import "server-only";

/*
 * Text messages through Africa's Talking (https://africastalking.com), the
 * usual SMS provider in Kenya. Off until AFRICASTALKING_USERNAME and
 * AFRICASTALKING_API_KEY are set (see .env.example); until then nothing is
 * sent and members still see every update in their account. The username
 * "sandbox" uses Africa's Talking's test environment.
 */

export const isSmsConfigured = () => !!process.env.AFRICASTALKING_USERNAME && !!process.env.AFRICASTALKING_API_KEY;

type Recipient = { status?: string; statusCode?: number; number?: string };

/** Sends one text to an international number (+254…). Resolves to whether it was accepted; never throws. */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  if (!username || !apiKey) {
    console.info(`[sms] Not sent (Africa's Talking isn't set up): ${to}`);
    return false;
  }

  const endpoint = username === "sandbox" ? "https://api.sandbox.africastalking.com/version1/messaging" : "https://api.africastalking.com/version1/messaging";
  const body = new URLSearchParams({ username, to, message: message.slice(0, 459) });
  const sender = process.env.AFRICASTALKING_SENDER_ID;
  if (sender) body.set("from", sender);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`[sms] Africa's Talking answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
      return false;
    }
    const json = (await response.json()) as { SMSMessageData?: { Recipients?: Recipient[] } };
    const recipient = json.SMSMessageData?.Recipients?.[0];
    const sent = recipient?.status === "Success" || recipient?.statusCode === 101 || recipient?.statusCode === 100 || recipient?.statusCode === 102;
    if (!sent) console.error(`[sms] Not accepted for ${to}: ${recipient?.status ?? "no recipient"}`);
    return sent;
  } catch (error) {
    console.error("[sms] Couldn't reach Africa's Talking:", error instanceof Error ? error.message : error);
    return false;
  }
}
