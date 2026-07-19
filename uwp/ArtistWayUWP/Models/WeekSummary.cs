namespace ArtistWayUWP.Models
{
    // Resumo mostrado no cartão de decisão da Home quando os 7 dias de uma
    // semana terminam (ver LocalDataStore.BuildWeekSummaryAsync).
    public sealed class WeekSummary
    {
        public int WeekId { get; set; }
        public int DoneCount { get; set; }
        public int TotalItems { get; set; }
        public bool CheckinDone { get; set; }
        public bool ArtistDateDone { get; set; }
        public int MorningPagesDone { get; set; }
    }
}
