namespace ArtistWayUWP.Models
{
    // "list" -> NamedListPage(Key); "screen" -> uma das poucas telas
    // fixas de ferramenta (lifePie, circuloSeguranca, principiosBasicos).
    public sealed class ChecklistLink
    {
        public string Type { get; set; }
        public string Key { get; set; }
    }

    public sealed class ChecklistItem
    {
        public string Task { get; set; }
        public string Detail { get; set; }
        public ChecklistLink Link { get; set; }
    }
}
