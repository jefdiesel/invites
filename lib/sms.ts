import twilio from "twilio";

let _client: twilio.Twilio | null = null;
function getTwilio() {
  if (!_client) _client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  return _client;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.startsWith("+")) return phone;
  return `+${digits}`;
}

async function sendSMS(to: string, body: string) {
  if (!to || to.replace(/\D/g, "").length < 10) return;
  if (!process.env.TWILIO_ACCOUNT_SID) return; // skip if not configured
  try {
    await getTwilio().messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalizePhone(to),
    });
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}

export async function sendBookingConfirmationSMS(data: {
  phone: string; guestName: string; restaurantName: string;
  date: string; time: string; partySize: number;
}) {
  const dateStr = new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = fmtTime(data.time);
  await sendSMS(data.phone,
    `Confirmed: ${data.restaurantName} on ${dateStr} at ${timeStr}, party of ${data.partySize}. Manage: itsremi.app/my`
  );
}

export async function sendBookingReminderSMS(data: {
  phone: string; guestName: string; restaurantName: string;
  time: string; partySize: number;
}) {
  const timeStr = fmtTime(data.time);
  await sendSMS(data.phone,
    `Reminder: ${data.restaurantName} tomorrow at ${timeStr}, party of ${data.partySize}. Can't make it? Cancel: itsremi.app/my`
  );
}

export async function sendWaitlistAddedSMS(data: {
  phone: string; restaurantName: string; quotedWaitMinutes: number; position: number;
}) {
  await sendSMS(data.phone,
    `You're #${data.position} on the waitlist at ${data.restaurantName}. Estimated wait: ~${data.quotedWaitMinutes} min. We'll text when your table is ready.`
  );
}

export async function sendTableReadySMS(data: {
  phone: string; restaurantName: string;
}) {
  await sendSMS(data.phone,
    `Your table is ready at ${data.restaurantName}! Please check in with the host.`
  );
}

export async function sendCancellationSMS(data: {
  phone: string; restaurantName: string; date: string; time: string; slug: string;
}) {
  const dateStr = new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = fmtTime(data.time);
  await sendSMS(data.phone,
    `Your reservation at ${data.restaurantName} on ${dateStr} at ${timeStr} has been cancelled. Rebook: itsremi.app/r/${data.slug}/book`
  );
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
