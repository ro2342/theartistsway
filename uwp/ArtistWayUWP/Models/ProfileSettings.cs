namespace ArtistWayUWP.Models
{
    // Espelha o objeto "profile" salvo hoje em www/js/db.js (STORES.settings,
    // key "profile").
    public sealed class ProfileSettings
    {
        public string Name { get; set; } = "";
        public string StartDate { get; set; } = "";
        public string MorningPagesTime { get; set; } = "07:00";
        public string ArtistDateDay { get; set; } = "7";
        public string ArtistDateTime { get; set; } = "16:00";
        public string CheckinDay { get; set; } = "7";
        public string CheckinTime { get; set; } = "19:00";
        public bool Onboarded { get; set; } = false;
        public string FontSize { get; set; } = "medium";
    }
}
