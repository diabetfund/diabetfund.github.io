using System.Text.Json.Serialization;

record Item<T> : ILocalized
{
    public required string Id { get; set; }
    public T? En { get; set; }
    public T? Ua { get; set; }
    public T? De { get; set; }
    public T? It { get; set; }
    public T? Pl { get; set; }

    public object? Locale(string lang) =>
        lang switch { "ua" => Ua, "it" => It, "de" => De, "pl" => Pl, _ => default }
        ?? En;
}

record Topic
{
    public string? Title { get; set; }
    public string? Text { get; set; }
}

record Partner : Item<Topic>;

record ProjectTopic(string? Data, string? Signature, string? Promo) : Topic;

record Project(
    int Need,
    int Funds,
    bool IsMilitary,
    bool DesktopOnly,
    string? ReportId,
    string? Pic,
    string? Poster,
    string Pdf) : Item<ProjectTopic>
{
    public bool IsFull => Need == Funds;

    public bool IsInfinite => Need == 0;

    public string Url => UrlSegment(Id);

    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    public static string UrlSegment(string id) =>
        id is "help-rehab" ? "center" : $"fundraising/{id}";
}

[JsonConverter(typeof(JsonStringEnumConverter))]
enum ThankTag
{
    Sweet, Meter, Libre, Medtronic, Strips, Insulin, Vitamin, Modulax, P999, Reservoir, Pods, Candies,
    Old, Man, Teen, Adult, Infant,
    Cat, Compose, AnimaAnimus, BedRidding, Collage, NoHead, NoBody, LowQuality, HighQuality
}

record ThankTopic : Topic
{
    public string Sign => string.IsNullOrEmpty(Title) ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thank(
    List<ThankTag> Tags,
    int? Altitude,
    string? Video,
    string? Avatar,
    int? MainIndex,
    DateOnly Date,
    bool DesktopOnly) : Item<ThankTopic>
{
    public string ZeroOrAvatar =>
        Avatar is { } avatar
        ? avatar.EndsWith("webp") ? avatar.Replace("webp", "png") : avatar
        : "zero.png";

    public string ModernAvatar => Avatar ?? "zero.webp";

    public string Alt => Debug ? string.Join(", ", Alts()) : "";

    IEnumerable<string?> Alts()
    {
        foreach (var tag in Tags)
            yield return Enum.GetName(tag);
        yield return Id.ToString();
    }

    public static bool Debug = false;
}

record Slide(string Pic) : Item<string>
{
    public string Url => Project.UrlSegment(Id);
}

record Wallet(string Address, bool IsCrypto) : Item<string>;

record News(DateOnly Date) : Item<Topic>
{
    public string JsonDate => Date.ToString("o");
    public string? LocaleDate { get; set; }
}

record StoneTopic(string CertificateIntro) : Topic;

record Stone(string MiniLeft, string MiniRight) : Item<StoneTopic>;