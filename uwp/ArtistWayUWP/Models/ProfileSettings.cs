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

        // "light" / "dark" / "auto" — mesmo campo e mesmos valores de
        // profile.themeMode no PWA (www/js/theme.js), pra sincronizar como
        // a mesma escolha nos dois aparelhos.
        public string ThemeMode { get; set; } = "auto";

        // Desliga o checklist/check-in semanal, deixando só Morning Pages e
        // Artist Date -- ativado manualmente aqui ou automaticamente quando
        // a semana calculada passa de 12 (ver WeekCalculator/HomePage).
        public bool MaintenanceMode { get; set; } = false;

        // Contrato Inicial assinável (onboarding) -- o nome digitado como
        // "assinatura" e quando foi assinado.
        public string ContractSignedName { get; set; } = "";
        public string ContractSignedAt { get; set; } = "";
    }
}
