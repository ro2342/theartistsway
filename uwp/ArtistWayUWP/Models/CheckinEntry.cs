using System.Collections.Generic;

namespace ArtistWayUWP.Models
{
    public sealed class CheckinEntry
    {
        // Chave = índice da pergunta (como string, "0", "1", "2"...).
        public Dictionary<string, string> Answers { get; set; } = new Dictionary<string, string>();
        public string SavedAt { get; set; } = "";
    }
}
