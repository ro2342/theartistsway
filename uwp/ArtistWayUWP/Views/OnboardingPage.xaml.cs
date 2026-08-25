using System;
using System.Linq;
using ArtistWayUWP.Models;
using ArtistWayUWP.Services;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ArtistWayUWP.Views
{
    public sealed partial class OnboardingPage : Page
    {
        private int _step;
        private StackPanel[] _panels;

        public OnboardingPage()
        {
            this.InitializeComponent();
            _panels = new[] { ReturningUserPanel, WelcomePanel, NameDatePanel, RitualsPanel, ContractPanel };

            AppTitleText1.Text = ContentStore.S("onboarding.appTitle");
            AppTitleText2.Text = ContentStore.S("onboarding.appTitle");
            ReturningUserQuestionText.Text = ContentStore.S("onboarding.returningUser.question");
            ReturningUserDescriptionText.Text = ContentStore.S("onboarding.returningUser.description");
            ReturningUserLoginButton.Content = ContentStore.S("onboarding.returningUser.loginButton");
            SkipLoginButton.Content = ContentStore.S("onboarding.returningUser.skipButton");
            WelcomeQuoteText.Text = ContentStore.S("onboarding.welcome.quote");
            WelcomeDescriptionText.Text = ContentStore.S("onboarding.welcome.description");
            WelcomeStartButton.Content = ContentStore.S("onboarding.welcome.startButton");
            NameDateTitleText.Text = ContentStore.S("onboarding.nameDate.title");
            NameDateSubtitleText.Text = ContentStore.S("onboarding.nameDate.subtitle");
            NameLabelText.Text = ContentStore.S("onboarding.nameDate.nameLabel");
            StartDateLabelText.Text = ContentStore.S("onboarding.nameDate.startDateLabel");
            BackButton1.Content = ContentStore.S("onboarding.backButton");
            ContinueButton1.Content = ContentStore.S("onboarding.continueButton");
            RitualsTitleText.Text = ContentStore.S("onboarding.rituals.title");
            RitualsSubtitleText.Text = ContentStore.S("onboarding.rituals.subtitle");
            MorningPagesSectionText.Text = ContentStore.S("onboarding.rituals.morningPagesSection");
            MpTimeLabelText.Text = ContentStore.S("onboarding.rituals.timeLabel");
            ArtistDateSectionText.Text = ContentStore.S("onboarding.rituals.artistDateSection");
            AdWeekdayLabelText.Text = ContentStore.S("onboarding.rituals.weekdayLabel");
            AdTimeLabelText.Text = ContentStore.S("onboarding.rituals.timeLabel");
            CheckinSectionText.Text = ContentStore.S("onboarding.rituals.checkinSection");
            CiWeekdayLabelText.Text = ContentStore.S("onboarding.rituals.weekdayLabel");
            CiTimeLabelText.Text = ContentStore.S("onboarding.rituals.timeLabel");
            BackButton2.Content = ContentStore.S("onboarding.backButton");
            ContinueButton2.Content = ContentStore.S("onboarding.continueButton");
            ContractTitleText.Text = ContentStore.S("onboarding.contract.title");
            ContractDescriptionText.Text = ContentStore.S("onboarding.contract.description");
            SignatureLabelText.Text = ContentStore.S("onboarding.contract.signatureLabel");
            BackButton3.Content = ContentStore.S("onboarding.backButton");
            FinishButton.Content = ContentStore.S("onboarding.contract.finishButton");

            string[] weekdayNames = new[] { "" }.Concat(ContentStore.S("common.weekdayNames").Split(',')).ToArray();
            for (int i = 1; i <= 7; i++)
            {
                ArtistDateDayCombo.Items.Add(new ComboBoxItem { Content = weekdayNames[i], Tag = i });
                CheckinDayCombo.Items.Add(new ComboBoxItem { Content = weekdayNames[i], Tag = i });
            }

            DateTime suggestedStart = WeekCalculator.StartOfWeek(DateTime.Now.AddDays(7));
            StartDatePicker.Date = new DateTimeOffset(suggestedStart);
            MorningPagesTimePicker.Time = new TimeSpan(7, 0, 0);
            ArtistDateTimePicker.Time = new TimeSpan(16, 0, 0);
            CheckinTimePicker.Time = new TimeSpan(19, 0, 0);
            ArtistDateDayCombo.SelectedIndex = 6; // Sábado
            CheckinDayCombo.SelectedIndex = 6;

            ShowStep(0);
        }

        private void ShowStep(int step)
        {
            _step = step;
            for (int i = 0; i < _panels.Length; i++)
            {
                _panels[i].Visibility = i == step ? Visibility.Visible : Visibility.Collapsed;
            }

            if (_panels[step] == ContractPanel)
            {
                string name = string.IsNullOrEmpty(NameBox.Text.Trim()) ? "___" : NameBox.Text.Trim();
                ContractText.Text = ContentStore.S("onboarding.contract.sentence", "name", name);
                if (string.IsNullOrEmpty(SignatureBox.Text))
                {
                    SignatureBox.Text = NameBox.Text.Trim();
                }
            }
        }

        private void Next_Click(object sender, RoutedEventArgs e)
        {
            ShowStep(_step + 1);
        }

        // Passo 0: já é usuário em outro aparelho? Entra com a mesma conta
        // Google, puxa o que já existe na nuvem e, se achar um perfil já
        // onboarded, pula o resto do formulário inteiro — evita reescrever
        // nome/horários/dias que já foram preenchidos da primeira vez.
        private async void ReturningUserLogin_Click(object sender, RoutedEventArgs e)
        {
            Button button = (Button)sender;
            button.IsEnabled = false;
            button.Content = ContentStore.S("onboarding.returningUser.loggingIn");
            ReturningUserStatusText.Visibility = Visibility.Visible;
            ReturningUserStatusText.Text = ContentStore.S("onboarding.returningUser.loggingInStatus");

            AuthResult result = await AuthService.SignInWithGoogleConsentAsync();
            if (!result.Success)
            {
                button.IsEnabled = true;
                button.Content = ContentStore.S("onboarding.returningUser.loginButton");
                ReturningUserStatusText.Text = result.ErrorMessage ?? ContentStore.S("onboarding.returningUser.loginFailedDefault");
                return;
            }

            SessionService.SaveSession(result);
            ReturningUserStatusText.Text = ContentStore.S("onboarding.returningUser.syncingStatus");
            await SyncService.SyncAllAsync();

            ProfileSettings profile = await LocalDataStore.GetProfileAsync();
            if (profile != null && profile.Onboarded)
            {
                NotificationService.ApplySettings(profile);
                MainPage.Current.CompleteOnboarding();
                return;
            }

            button.IsEnabled = true;
            button.Content = ContentStore.S("onboarding.returningUser.loginButton");
            ReturningUserStatusText.Text = ContentStore.S("onboarding.returningUser.noDataFoundStatus");
            ShowStep(1);
        }

        private void Back_Click(object sender, RoutedEventArgs e)
        {
            ShowStep(_step - 1);
        }

        private async void Finish_Click(object sender, RoutedEventArgs e)
        {
            ProfileSettings profile = new ProfileSettings
            {
                Name = NameBox.Text.Trim(),
                StartDate = StartDatePicker.Date.ToString("yyyy-MM-dd"),
                MorningPagesTime = MorningPagesTimePicker.Time.ToString(@"hh\:mm"),
                ArtistDateDay = ((ComboBoxItem)ArtistDateDayCombo.SelectedItem)?.Tag.ToString() ?? "7",
                ArtistDateTime = ArtistDateTimePicker.Time.ToString(@"hh\:mm"),
                CheckinDay = ((ComboBoxItem)CheckinDayCombo.SelectedItem)?.Tag.ToString() ?? "7",
                CheckinTime = CheckinTimePicker.Time.ToString(@"hh\:mm"),
                Onboarded = true,
                ContractSignedName = string.IsNullOrEmpty(SignatureBox.Text.Trim()) ? NameBox.Text.Trim() : SignatureBox.Text.Trim(),
                ContractSignedAt = DateTime.UtcNow.ToString("o"),
            };

            await LocalDataStore.SetProfileAsync(profile);
            NotificationService.ApplySettings(profile);

            MainPage.Current.CompleteOnboarding();
        }
    }
}
