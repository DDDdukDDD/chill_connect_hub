/**
 * Sends the phone code. No SMS provider is connected yet (the owner opens the account), so smsReady() is false:
 * a local server shows the code on screen, and the live site keeps the email rule (lib/members/trust.ts, organizerNeeds).
 * To connect one: send the message in sendSms and make smsReady() true when its key is set.
 */
export function smsReady(): boolean {
  return false;
}

export async function sendSms(phone: string, text: string): Promise<void> {
  void phone;
  void text;
  throw new Error('No SMS provider is connected');
}
