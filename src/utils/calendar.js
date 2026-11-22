/**
 * Utilities for calendar link generation and formatting
 */

export function createGoogleCalendarUrl({ title, description, location, startDate, startTime, durationHours = 3 }) {
  // Format dates: YYYYMMDDTHHmmssZ
  const dateParts = startDate.split('-'); // 2026, 11, 20
  const timeParts = startTime.split(':'); // 08, 00

  const start = new Date(Date.UTC(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    parseInt(timeParts[0]) - 7, // Convert UTC+7 to UTC
    parseInt(timeParts[1])
  ));

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  const formatUtc = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile({ title, description, location, startDate, startTime, durationHours = 3 }) {
  const dateParts = startDate.split('-');
  const timeParts = startTime.split(':');

  const start = new Date(Date.UTC(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    parseInt(timeParts[0]) - 7,
    parseInt(timeParts[1])
  ));

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const formatUtc = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GradInvite//Graduation Invitation//VI',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'le-tot-nghiep.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

