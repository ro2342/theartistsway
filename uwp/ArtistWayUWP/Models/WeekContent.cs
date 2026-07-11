using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    public sealed class WeekContent
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Intro { get; set; }
        public List<string> Essay { get; set; } = new List<string>();
        public List<ChecklistItem> Checklist { get; set; } = new List<ChecklistItem>();
        public string CheckinBonus { get; set; }
    }
}
