namespace ArtistWayUWP.Models
{
    public sealed class ArtistDateEntry
    {
        public bool Done { get; set; }
        public string Idea { get; set; } = "";
    }

    // Uma linha do histórico de Artist Dates (Recursos -> Histórico) —
    // igual ArtistDateEntry, mas com a semana (WeekStart) junto, já que o
    // histórico lista várias semanas de uma vez.
    public sealed class ArtistDateHistoryItem
    {
        public string WeekStart { get; set; }
        public bool Done { get; set; }
        public string Idea { get; set; } = "";
    }
}
