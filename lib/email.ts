import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

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

function cancelUrl(slug: string, bookingId: string): string {
  return `https://itsremi.app/r/${slug}/cancel/${bookingId}`;
}

const btnStyle = `display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; color: #fff; background: #171717; border-radius: 8px; text-decoration: none;`;
const cancelBtnStyle = `display: inline-block; padding: 10px 20px; font-size: 14px; font-weight: 600; color: #dc2626; background: #fef2f2; border-radius: 8px; text-decoration: none;`;

export async function sendBookingConfirmation(data: {
  guestEmail: string;
  guestName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  slug: string;
  bookingId: string;
}) {
  const { guestEmail, guestName, restaurantName, date, time, partySize, slug, bookingId } = data;
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

          <div style="margin: 0 0 24px;">
            <a href="https://itsremi.app/r/${slug}" style="${btnStyle}">
              View ${restaurantName}
            </a>
          </div>

          <a href="${cancelUrl(slug, bookingId)}" style="${cancelBtnStyle}">
            Cancel Reservation
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
  bookingId: string;
}) {
  const { guestEmail, guestName, restaurantName, date, time, partySize, slug, bookingId } = data;
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
            ${guestName}, your reservation at <strong>${restaurantName}</strong> is tomorrow.
          </p>

          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
            <div style="font-size: 18px; font-weight: 700; color: #171717; margin: 0 0 4px;">${dateStr}</div>
            <div style="font-size: 18px; color: #171717; margin: 0 0 12px;">${timeStr}</div>
            <div style="font-size: 14px; color: #525252;">${partySize} ${partySize === 1 ? "guest" : "guests"}</div>
          </div>

          <p style="font-size: 14px; color: #525252; margin: 0 0 24px;">
            Can't make it? Cancel so they can free up your table:
          </p>

          <a href="${cancelUrl(slug, bookingId)}" style="${cancelBtnStyle}">
            Cancel Reservation
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

export async function sendCancellationEmail(data: {
  guestEmail: string;
  guestName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  slug: string;
  note?: string;
}) {
  const { guestEmail, guestName, restaurantName, date, time, partySize, slug, note } = data;
  const dateStr = formatDate(date);
  const timeStr = formatTime(time);

  try {
    await getResend().emails.send({
      from: `${restaurantName} via Remi <reservations@itsremi.app>`,
      to: guestEmail,
      subject: `Reservation cancelled — ${dateStr} at ${timeStr}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #171717; margin: 0 0 8px;">Reservation Cancelled</h1>
          <p style="font-size: 16px; color: #525252; margin: 0 0 24px;">
            ${guestName}, your reservation at <strong>${restaurantName}</strong> has been cancelled.
          </p>

          <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 0 0 24px; border: 1px solid #fecaca;">
            <div style="font-size: 16px; color: #991b1b; margin: 0 0 4px; text-decoration: line-through;">${dateStr} at ${timeStr}</div>
            <div style="font-size: 14px; color: #991b1b;">${partySize} ${partySize === 1 ? "guest" : "guests"}</div>
          </div>

          ${note ? `
          <div style="background: #f5f5f5; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
            <div style="font-size: 13px; font-weight: 600; color: #525252; margin: 0 0 4px;">Note from ${restaurantName}:</div>
            <div style="font-size: 14px; color: #171717;">${note}</div>
          </div>
          ` : ""}

          <p style="font-size: 14px; color: #525252; margin: 0 0 24px;">
            We're sorry for any inconvenience. You can rebook anytime:
          </p>

          <a href="https://itsremi.app/r/${slug}/book" style="${btnStyle}">
            Book Again
          </a>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="font-size: 12px; color: #a3a3a3; margin: 0;">
            Sent by <a href="https://itsremi.app" style="color: #a3a3a3;">Remi</a> on behalf of ${restaurantName}
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
  }
}
