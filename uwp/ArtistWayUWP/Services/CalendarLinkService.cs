using System;

namespace ArtistWayUWP.Services
{
    // Porta pra C# a mesma lógica que existia em www/js/calendar.js: monta
    // links "calendar.google.com/render" já preenchidos com o evento
    // recorrente -- sem OAuth, sem Google Cloud Console.
    public static class CalendarLinkService
    {
        private static readonly string[] RruleDay = { "", "SU", "MO", "TU", "WE", "TH", "FR", "SA" };

        private static DateTime NextOccurrence(int hour, int minute, int? weekdayIndex)
        {
            DateTime now = DateTime.Now;
            DateTime result = now.Date.AddHours(hour).AddMinutes(minute);

            if (weekdayIndex == null)
            {
                if (result <= now)
                {
                    result = result.AddDays(1);
                }
                return result;
            }

            int targetDow = weekdayIndex.Value - 1; // convenção: 1=domingo..7=sábado
            int diff = ((targetDow - (int)result.DayOfWeek) + 7) % 7;
            if (diff == 0 && result <= now)
            {
                diff = 7;
            }
            return result.AddDays(diff);
        }

        private static string FormatDate(DateTime d)
        {
            return d.ToString("yyyyMMdd'T'HHmmss");
        }

        private static string BuildUrl(string title, string details, int hour, int minute, int durationMinutes, int? weekdayIndex, string recur)
        {
            DateTime start = NextOccurrence(hour, minute, weekdayIndex);
            DateTime end = start.AddMinutes(durationMinutes);
            string dates = FormatDate(start) + "/" + FormatDate(end);
            string url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
                + "&text=" + Uri.EscapeDataString(title)
                + "&details=" + Uri.EscapeDataString(details)
                + "&dates=" + dates;
            if (recur == "daily")
            {
                url += "&recur=RRULE:FREQ=DAILY";
            }
            else if (recur == "weekly" && weekdayIndex.HasValue)
            {
                url += "&recur=RRULE:FREQ=WEEKLY;BYDAY=" + RruleDay[weekdayIndex.Value];
            }
            return url;
        }

        private static void ParseTime(string time, out int hour, out int minute)
        {
            string[] parts = (string.IsNullOrEmpty(time) ? "00:00" : time).Split(':');
            hour = int.Parse(parts[0]);
            minute = int.Parse(parts[1]);
        }

        public static string MorningPagesUrl(string time)
        {
            ParseTime(time, out int h, out int m);
            return BuildUrl("Morning Pages ✍️", "3 páginas à mão, sem reler. Companheiro The Artist's Way.", h, m, 30, null, "daily");
        }

        public static string ArtistDateUrl(int weekdayIndex, string time)
        {
            ParseTime(time, out int h, out int m);
            return BuildUrl("Artist Date 🎨", "Um encontro solo, só por prazer, para encher o poço criativo. Companheiro The Artist's Way.", h, m, 90, weekdayIndex, "weekly");
        }

        public static string CheckinUrl(int weekdayIndex, string time)
        {
            ParseTime(time, out int h, out int m);
            return BuildUrl("Check-in semanal 📓", "Revisar a semana: Morning Pages, Artist Date e reflexões. Companheiro The Artist's Way.", h, m, 20, weekdayIndex, "weekly");
        }
    }
}
