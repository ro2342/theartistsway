using System;
using ArtistWayUWP.Models;

namespace ArtistWayUWP.Services
{
    // Mesma lógica de semana/data que já existia em www/js/app.js
    // (getCurrentWeekId, weekKeyForOffset, startOfWeek, dateToStr).
    public static class WeekCalculator
    {
        public static DateTime StartOfWeek(DateTime d)
        {
            DateTime date = d.Date;
            return date.AddDays(-(int)date.DayOfWeek);
        }

        public static string DateToStr(DateTime d)
        {
            return d.ToString("yyyy-MM-dd");
        }

        public static int GetCurrentWeekId(ProfileSettings profile)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return 1;
            }
            DateTime start = StartOfWeek(startDate);
            DateTime now = StartOfWeek(DateTime.Now);
            int diffWeeks = (int)Math.Round((now - start).TotalDays / 7.0);
            return Math.Min(12, Math.Max(1, diffWeeks + 1));
        }

        public static string WeekKeyForOffset(ProfileSettings profile, int weekId)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return DateToStr(StartOfWeek(DateTime.Now));
            }
            DateTime start = StartOfWeek(startDate);
            DateTime weekStart = start.AddDays((weekId - 1) * 7);
            return DateToStr(weekStart);
        }

        public const int ProgramLengthDays = 84; // 12 semanas x 7 dias

        // Contador de dias (Home) -- mesmo cálculo do PWA (dayCountSinceStart
        // em app.js), sem guardar nenhum dado novo.
        public static int? GetDayCount(ProfileSettings profile)
        {
            if (profile == null || string.IsNullOrEmpty(profile.StartDate) ||
                !DateTime.TryParse(profile.StartDate, out DateTime startDate))
            {
                return null;
            }
            return (int)(DateTime.Now.Date - startDate.Date).TotalDays + 1;
        }

        public static bool IsProgramFinished(ProfileSettings profile)
        {
            int? dayCount = GetDayCount(profile);
            return dayCount.HasValue && dayCount.Value > ProgramLengthDays;
        }
    }
}
