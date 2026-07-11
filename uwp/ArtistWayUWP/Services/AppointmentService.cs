using System;
using System.Threading.Tasks;
using Windows.ApplicationModel.Appointments;
using Windows.Foundation;

namespace ArtistWayUWP.Services
{
    // Alternativa nativa ao link do Google Calendar: adiciona o compromisso
    // recorrente direto no app de Calendário do próprio Windows via
    // AppointmentManager.ShowAddAppointmentAsync -- é um fluxo de composição
    // mediado pelo sistema (o usuário confirma antes de salvar). Precisa da
    // capability "appointmentsSystem" declarada no manifesto (ver
    // Package.appxmanifest) -- sem ela a chamada falha.
    public static class AppointmentService
    {
        public static async Task<bool> AddDailyAsync(string subject, string details, TimeSpan time, int durationMinutes, Rect selection)
        {
            DateTime start = DateTime.Today.Add(time);
            if (start <= DateTime.Now)
            {
                start = start.AddDays(1);
            }

            Appointment appointment = new Appointment
            {
                Subject = subject,
                Details = details,
                StartTime = start,
                Duration = TimeSpan.FromMinutes(durationMinutes),
                Recurrence = new AppointmentRecurrence
                {
                    Unit = AppointmentRecurrenceUnit.Daily,
                    Interval = 1,
                },
            };

            string id = await AppointmentManager.ShowAddAppointmentAsync(appointment, selection);
            return !string.IsNullOrEmpty(id);
        }

        public static async Task<bool> AddWeeklyAsync(string subject, string details, int weekdayIndex, TimeSpan time, int durationMinutes, Rect selection)
        {
            DateTime start = NextOccurrence(weekdayIndex, time);

            Appointment appointment = new Appointment
            {
                Subject = subject,
                Details = details,
                StartTime = start,
                Duration = TimeSpan.FromMinutes(durationMinutes),
                Recurrence = new AppointmentRecurrence
                {
                    Unit = AppointmentRecurrenceUnit.Weekly,
                    Interval = 1,
                    DaysOfWeek = ToAppointmentDaysOfWeek(start.DayOfWeek),
                },
            };

            string id = await AppointmentManager.ShowAddAppointmentAsync(appointment, selection);
            return !string.IsNullOrEmpty(id);
        }

        // weekdayIndex: 1=domingo..7=sábado, mesma convenção do resto do app.
        private static DateTime NextOccurrence(int weekdayIndex, TimeSpan time)
        {
            DateTime now = DateTime.Now;
            DateTime candidate = DateTime.Today.Add(time);
            int targetDow = weekdayIndex - 1;
            int diff = (targetDow - (int)candidate.DayOfWeek + 7) % 7;
            if (diff == 0 && candidate <= now)
            {
                diff = 7;
            }
            return candidate.AddDays(diff);
        }

        private static AppointmentDaysOfWeek ToAppointmentDaysOfWeek(DayOfWeek day)
        {
            switch (day)
            {
                case DayOfWeek.Sunday: return AppointmentDaysOfWeek.Sunday;
                case DayOfWeek.Monday: return AppointmentDaysOfWeek.Monday;
                case DayOfWeek.Tuesday: return AppointmentDaysOfWeek.Tuesday;
                case DayOfWeek.Wednesday: return AppointmentDaysOfWeek.Wednesday;
                case DayOfWeek.Thursday: return AppointmentDaysOfWeek.Thursday;
                case DayOfWeek.Friday: return AppointmentDaysOfWeek.Friday;
                default: return AppointmentDaysOfWeek.Saturday;
            }
        }
    }
}
