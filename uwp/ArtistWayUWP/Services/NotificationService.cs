using System;
using ArtistWayUWP.Models;
using Windows.Data.Xml.Dom;
using Windows.UI.Notifications;

namespace ArtistWayUWP.Services
{
    // Mesma lógica de agendamento de toasts que existia em
    // MainPage.xaml.cs (ScheduleNotifications) na versão WebView -- só que
    // agora chamada direto com um ProfileSettings, sem round-trip de JSON
    // vindo de uma ponte JS que não existe mais.
    public static class NotificationService
    {
        public static void ApplySettings(ProfileSettings profile)
        {
            ToastNotifier notifier = ToastNotificationManager.CreateToastNotifier();

            foreach (ScheduledToastNotification scheduled in notifier.GetScheduledToastNotifications())
            {
                notifier.RemoveFromSchedule(scheduled);
            }

            if (!string.IsNullOrEmpty(profile.MorningPagesTime) &&
                TryParseTime(profile.MorningPagesTime, out int mpHour, out int mpMinute))
            {
                ScheduleDaily(
                    notifier,
                    "morningPages",
                    "Hora das Morning Pages ✍️",
                    "Três páginas, sem reler. Só você e o papel.",
                    mpHour,
                    mpMinute,
                    daysAhead: 30);
            }

            if (int.TryParse(profile.ArtistDateDay, out int artistDateDay) &&
                !string.IsNullOrEmpty(profile.ArtistDateTime) &&
                TryParseTime(profile.ArtistDateTime, out int adHour, out int adMinute))
            {
                ScheduleWeekly(
                    notifier,
                    "artistDate",
                    "Que tal um Artist Date? 🎨",
                    "Reserve um tempinho sozinho(a) essa semana, só por prazer.",
                    artistDateDay,
                    adHour,
                    adMinute,
                    occurrences: 12);
            }

            if (int.TryParse(profile.CheckinDay, out int checkinDay) &&
                !string.IsNullOrEmpty(profile.CheckinTime) &&
                TryParseTime(profile.CheckinTime, out int ciHour, out int ciMinute))
            {
                ScheduleWeekly(
                    notifier,
                    "checkin",
                    "Check-in semanal 📓",
                    "Hora de revisar como foi sua semana criativa.",
                    checkinDay,
                    ciHour,
                    ciMinute,
                    occurrences: 12);
            }
        }

        private static void ScheduleDaily(ToastNotifier notifier, string tag, string title, string body, int hour, int minute, int daysAhead)
        {
            DateTimeOffset now = DateTimeOffset.Now;
            DateTimeOffset first = new DateTimeOffset(now.Year, now.Month, now.Day, hour, minute, 0, now.Offset);
            if (first <= now)
            {
                first = first.AddDays(1);
            }

            for (int i = 0; i < daysAhead; i++)
            {
                DateTimeOffset deliveryTime = first.AddDays(i);
                ScheduledToastNotification scheduled = new ScheduledToastNotification(BuildToastXml(title, body), deliveryTime)
                {
                    Tag = tag + "-" + i,
                    Group = tag,
                };
                notifier.AddToSchedule(scheduled);
            }
        }

        private static void ScheduleWeekly(ToastNotifier notifier, string tag, string title, string body, int ourWeekday, int hour, int minute, int occurrences)
        {
            DayOfWeek targetDayOfWeek = (DayOfWeek)(ourWeekday - 1);
            DateTimeOffset now = DateTimeOffset.Now;
            DateTimeOffset candidate = new DateTimeOffset(now.Year, now.Month, now.Day, hour, minute, 0, now.Offset);

            int diff = ((int)targetDayOfWeek - (int)candidate.DayOfWeek + 7) % 7;
            if (diff == 0 && candidate <= now)
            {
                diff = 7;
            }
            candidate = candidate.AddDays(diff);

            for (int i = 0; i < occurrences; i++)
            {
                DateTimeOffset deliveryTime = candidate.AddDays(7 * i);
                ScheduledToastNotification scheduled = new ScheduledToastNotification(BuildToastXml(title, body), deliveryTime)
                {
                    Tag = tag + "-" + i,
                    Group = tag,
                };
                notifier.AddToSchedule(scheduled);
            }
        }

        private static XmlDocument BuildToastXml(string title, string body)
        {
            string xml =
                "<toast>" +
                  "<visual>" +
                    "<binding template=\"ToastGeneric\">" +
                      "<text>" + EscapeXml(title) + "</text>" +
                      "<text>" + EscapeXml(body) + "</text>" +
                    "</binding>" +
                  "</visual>" +
                "</toast>";

            XmlDocument doc = new XmlDocument();
            doc.LoadXml(xml);
            return doc;
        }

        private static bool TryParseTime(string hhmm, out int hour, out int minute)
        {
            hour = 0;
            minute = 0;
            if (string.IsNullOrEmpty(hhmm))
            {
                return false;
            }
            string[] parts = hhmm.Split(':');
            if (parts.Length != 2)
            {
                return false;
            }
            return int.TryParse(parts[0], out hour) && int.TryParse(parts[1], out minute);
        }

        private static string EscapeXml(string s)
        {
            if (s == null)
            {
                return "";
            }
            return s
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&apos;");
        }
    }
}
