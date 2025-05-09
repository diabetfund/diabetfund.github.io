using Utilities.StaticSite;
using System.Globalization;
using System.Text.Json.Serialization;
using Utilities;

record Topic
{
    public string? Title, Brief;
}

abstract record Entity : ILocalized
{
    public string? Key;
    public DateOnly? Date;
    public bool? IsArchived;

    [JsonIgnore]
    public string? Id => Key?.ToString();

    public abstract object? GetLocalized(CultureInfo? culture);
}

record Entity<T> : Entity
{
    public T? En, Uk, De, Pl, It;
    
    public sealed override object? GetLocalized(CultureInfo? culture) =>
        GetTopicRef(culture?.LCID ?? Language.English);

    public void SetLocalized(CultureInfo culture, T topic) =>
        GetTopicRef(culture.LCID) = topic;

    ref T? GetTopicRef(int id)
    {
        switch (id)
        {
            case Language.Ukrainian: return ref Uk;
            case Language.German: return ref De;
            case Language.Polish: return ref Pl;
            case Language.Italian: return ref It;
            default: return ref En;
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

record Partner : Entity<Topic>;

enum ProjectType
{
    Diabetic,
    Humanitarian,
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
    public string? Uri, Pic, CardPic, Document, PromoPoster;

    [JsonIgnore]
    public bool DesktopOnly;

    [JsonIgnore]
    public bool IsMilitary => Type == ProjectType.Military;

    [JsonIgnore]
    public bool IsFull => Need == Funds;

    [JsonIgnore]
    public bool IsInfinite => Need == 0;

    [JsonIgnore]
    public bool HasResult => !string.IsNullOrEmpty(En?.Result);

    [JsonIgnore]
    public string Url =>
        Uri is "help-rehab" ? "/center" : $"/fundraising/{Uri}";

    [JsonIgnore]
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    [JsonIgnore]
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    [JsonIgnore]
    public string? MobilePic => Pic?.Replace(".webp", "-mob.webp");
}

[Flags]
enum ThankTag : ulong
{
    None, Meter, Libre, Medtronic = 4, Strips = 8, Insulin = 16, Vitamin = 32, Modulax = 64,
    P999 = 128, Reservoir = 256, Pods = 512, Candies = 1024,
    Old = 2048, Man = 4096, Teen = 8192, Adult = 16384, Infant = 32768,
    Cat = 65536, Compose = 131072, BedRidding = 262144, Collage = 524288, NoHead = 1048576, 
    NoBody = 2097152, LowQuality = 4194304, HighQuality = 8388608,
    GB = 16777216, Sweet = 33554432 
}

record ThankTopic : Topic
{
    [JsonIgnore]
    public string Sign => string.IsNullOrEmpty(Title) ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thank : Entity<ThankTopic>
{
    public ThankTag Tags;
    public int? Altitude, MainIndex;
    public string? Video, Avatar;

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

    [JsonIgnore]
    public string? Url;
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
    public string? Url, Pic;

    [JsonIgnore]
    public string IsoDate => Date!.Value.ToString("o");

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