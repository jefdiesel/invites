import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const FROM = "Remi <reservations@itsremi.app>";

function formatDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export async function sendBookingConfirmation(data: {
  guestEmail: string;
  guestName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  slug: string;
}) {
  const { guestEmail, guestName, restaurantName, date, time, partySize, slug } = data;
  const dateStr = formatDate(date);
  const timeStr = formatTime(time);

  try {
    await getResend().emails.send({
      from: `${restaurantName} via Remi <reservations@itsremi.app>`,
      to: guestEmail,
      subject: `Reservation confirmed — ${dateStr} at ${timeStr}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #171717; margin: 0 0 8px;">You're booked</h1>
          <p style="font-size: 16px; color: #525252; margin: 0 0 24px;">
            ${guestName}, your reservation at <strong>${restaurantName}</strong> is confirmed.
          </p>

          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
            <div style="font-size: 18px; font-weight: 700; color: #171717; margin: 0 0 4px;">${dateStr}</div>
            <div style="font-size: 18px; color: #171717; margin: 0 0 12px;">${timeStr}</div>
            <div style="font-size: 14px; color: #525252;">${partySize} ${partySize === 1 ? "guest" : "guests"}</div>
          </div>

          <p style="font-size: 14px; color: #737373; margin: 0 0 24px;">
            Need to change or cancel? Contact the restaurant directly.
          </p>

          <a href="https://itsremi.app/r/${slug}" style="display: inline-block; font-size: 14px; font-weight: 600; color: #171717; text-decoration: underline;">
            View ${restaurantName}
          </a>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="font-size: 12px; color: #a3a3a3; margin: 0;">
            Sent by <a href="https://itsremi.app" style="color: #a3a3a3;">Remi</a> on behalf of ${restaurantName}
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send booking confirmation:", err);
  }
}

export async function sendBookingReminder(data: {
  guestEmail: string;
  guestName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  slug: string;
}) {
  const { guestEmail, guestName, restaurantName, date, time, partySize, slug } = data;
  const dateStr = formatDate(date);
  const timeStr = formatTime(time);

  try {
    await getResend().emails.send({
      from: `${restaurantName} via Remi <reservations@itsremi.app>`,
      to: guestEmail,
      subject: `Reminder: ${restaurantName} tomorrow at ${timeStr}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #171717; margin: 0 0 8px;">See you tomorrow</h1>
          <p style="font-size: 16px; color: #525252; margin: 0 0 24px;">
            ${guestName}, this is a reminder about your reservation at <strong>${restaurantName}</strong>.
          </p>

          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
            <div style="font-size: 18px; font-weight: 700; color: #171717; margin: 0 0 4px;">${dateStr}</div>
            <div style="font-size: 18px; color: #171717; margin: 0 0 12px;">${timeStr}</div>
            <div style="font-size: 14px; color: #525252;">${partySize} ${partySize === 1 ? "guest" : "guests"}</div>
          </div>

          <p style="font-size: 14px; color: #737373; margin: 0 0 24px;">
            Can't make it? Please let the restaurant know so they can free up the table.
          </p>

          <a href="https://itsremi.app/r/${slug}" style="display: inline-block; font-size: 14px; font-weight: 600; color: #171717; text-decoration: underline;">
            View ${restaurantName}
          </a>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="font-size: 12px; color: #a3a3a3; margin: 0;">
            Sent by <a href="https://itsremi.app" style="color: #a3a3a3;">Remi</a> on behalf of ${restaurantName}
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send booking reminder:", err);
  }
}
