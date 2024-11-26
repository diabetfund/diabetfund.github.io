using Simplicity.StaticSite;
using Simplicity;
using System.Globalization;
using System.Text.Json.Serialization;

record Topic
{
    public string? Title, Brief;
}

record Entity<T> : ILocalized
{
    public string? Key;
    
    public T? English, Ukrainian, German, Polish, Italian;
    
    public object? GetLocalized(CultureInfo? culture) =>
        GetTopicRef(culture?.LCID ?? Language.English);

    public void SetLocalized(CultureInfo culture, T topic) =>
        GetTopicRef(culture.LCID) = topic;

    ref T? GetTopicRef(int id)
    {
        switch (id)
        {
            case Language.Ukrainian: return ref Ukrainian;
            case Language.German: return ref German;
            case Language.Polish: return ref Polish;
            case Language.Italian: return ref Italian;
            default: return ref English;
        }
    }
}

enum ContentType
{
    Funding,
    News,
    Results,
    Individual
}

record Partner : Entity<Topic> 
{
    public bool Hide;
}

enum ProjectType
{
    Diabet,
    Humanitary,
    Military
}

record ProjectTopic : Topic 
{
    public string? Content, Result, PromoVideo;
}

record Project : Entity<ProjectTopic>
{
    public ProjectType Type;
    public int Need, Funds;
    public string? Pic, CardPic, Document, PromoPoster;

    [JsonIgnore]
    public bool DesktopOnly;

    [JsonIgnore]
    public bool IsMilitary => Type == ProjectType.Military;

    [JsonIgnore]
    public bool IsFull => Need == Funds;

    [JsonIgnore]
    public bool IsInfinite => Need == 0;

    [JsonIgnore]
    public bool HasResult => !string.IsNullOrEmpty(English?.Result);

    [JsonIgnore]
    public string Url => UrlSegment(Key!);

    [JsonIgnore]
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    [JsonIgnore]
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    [JsonIgnore]
    public string? MobilePic => Pic?.Replace(".webp", "-mob.webp");

    public static string UrlSegment(string id) =>
        id is "help-rehab" ? "/center" : $"/fundraising/{id}";
}

enum ThankTag
{
    Sweet, Meter, Libre, Medtronic, Strips, Insulin, Vitamin, Modulax, P999, Reservoir, Pods, Candies,
    Old, Man, Teen, Adult, Infant,
    Cat, Compose, BedRidding, Collage, NoHead, NoBody, LowQuality, HighQuality
}

record ThankTopic : Topic
{
    [JsonIgnore]
    public string Sign => string.IsNullOrEmpty(Title) ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thank : Entity<ThankTopic>
{
    public List<ThankTag>? Tags;
    public int? Altitude, MainIndex;
    public string? Video, Avatar;
    public DateOnly Date;

    [JsonIgnore]
    public bool DesktopOnly;

    [JsonIgnore]
    public string ZeroOrAvatar =>
        Avatar is { } avatar
        ? avatar.EndsWith("webp") ? avatar.Replace("webp", "png") : avatar
        : "zero.png";

    [JsonIgnore]
    public string ModernAvatar => Avatar ?? "zero.webp";
}

record Slide : Entity<string>
{
    public string? Pic;
    public string Url => Project.UrlSegment(Key!);
}

record Wallet : Entity<string>
{
    public string? Address;
    public bool IsCrypto;
}

record NewsTopic : Topic
{
    public string? Content;
}

record News : Entity<NewsTopic>
{
    public DateOnly Date;
    public string? Pic;

    [JsonIgnore]
    public string IsoDate => Date.ToString("o");

    [JsonIgnore]
    public string? LocaleDate;
}

record StoneTopic : Topic
{
    public string? CertificateIntro;
}

record Stone : Entity<StoneTopic>
{
    public string? MiniLeft, MiniRight;
}