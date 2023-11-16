using System.Collections.Frozen;
using System.Globalization;
using System.Text.Json.Serialization;
using static Lang.Id;

record Lang(CultureInfo Culture, string Code, string Suffix)
{
    public enum Id
    {
        English = 1033,
        Українська = 1058,
        Deutsche = 1031,
        Polski = 1045,
        Italiana = 1040
    }

    public readonly static FrozenDictionary<Id, Lang> All =
        Array.ConvertAll([English, Українська, Deutsche, Polski, Italiana], lang =>
        {
            var info = CultureInfo.GetCultureInfo((int)lang);
            var code = lang == Українська ? "ua" : info.TwoLetterISOLanguageName;
            return new KeyValuePair<Id, Lang>(lang, new(info, code, $" {char.ToUpper(code[0])}{code[1]}"));
        })
        .ToFrozenDictionary();
}

record Topic
{
    public string? Title { get; set; }
    public string? Brief { get; set; }
}

record Entity<TTopic> : ILocalized
{
    public string? Key { get; set; }
    public Guid? NotionId { get; set; }

    public TTopic? En { get; set; }
    public TTopic? Ua { get; set; }
    public TTopic? De { get; set; }
    public TTopic? It { get; set; }
    public TTopic? Pl { get; set; }

    public object? GetLocalized(CultureInfo? culture) =>
        (Lang.Id?)culture?.LCID switch { Українська => Ua, Italiana => It, Deutsche => De, Polski => Pl, _ => En };

    public void SetLocalized(CultureInfo culture, TTopic topic)
    {
        switch ((Lang.Id)culture.LCID)
        {
            case Українська: Ua = topic; break;
            case Italiana: It = topic; break;
            case Deutsche: De = topic; break;
            case Polski: Pl = topic; break;
            default: En = topic; break;
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
    Diabet,
    Humanitary,
    Military
}

record ProjectTopic(
    string Content,
    string? Result,
    string? PromoVideo) : Topic;

record Project(
    ProjectType Type,
    int Need,
    int Funds,
    string Pic,
    string CardPic,
    string? Document,
    string? PromoPoster) : Entity<ProjectTopic>
{
    [JsonIgnore]
    public bool DesktopOnly { get; set; }

    [JsonIgnore]
    public bool IsMilitary => Type == ProjectType.Military;

    [JsonIgnore]
    public bool IsFull => Need == Funds;

    [JsonIgnore]
    public bool IsInfinite => Need == 0;

    [JsonIgnore]
    public bool HasResult => !string.IsNullOrEmpty(En?.Result);

    [JsonIgnore]
    public string Url => UrlSegment(Key!);

    [JsonIgnore]
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    [JsonIgnore]
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    [JsonIgnore]
    public string MobilePic => Pic.Replace(".webp", "-mob.webp");

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

record Thank(
    List<ThankTag>? Tags,
    int? Altitude,
    string? Video,
    string? Avatar,
    int? MainIndex,
    DateOnly Date) : Entity<ThankTopic>
{
    [JsonIgnore]
    public bool DesktopOnly { get; set; }

    [JsonIgnore]
    public string ZeroOrAvatar =>
        Avatar is { } avatar
        ? avatar.EndsWith("webp") ? avatar.Replace("webp", "png") : avatar
        : "zero.png";

    [JsonIgnore]
    public string ModernAvatar => Avatar ?? "zero.webp";
}

record Slide(string Pic) : Entity<string>
{
    public string Url => Project.UrlSegment(Key!);
}

record Wallet(string Address, bool IsCrypto) : Entity<string>;

record NewsTopic(string Content) : Topic;

record News(DateOnly Date, string Pic) : Entity<NewsTopic>
{
    [JsonIgnore]
    public string IsoDate => Date.ToString("o");

    [JsonIgnore]
    public string? LocaleDate { get; set; }
}

record StoneTopic(string CertificateIntro) : Topic;

record Stone(string MiniLeft, string MiniRight) : Entity<StoneTopic>;

//////////

public enum ProductType
{
    Glucometer,
    Strip,
    Needle,
    SyringePen,
    Syrigne,//p
    Lancet,
    Insulin,
    InsulinPump,
    InfusionQuickSet,
    InfusionSureTSet,
    InfusionSerter,
    DeviceForInstallingInfusion,
    Reservoir,
    Sensor,
    SensorTape,
    Sweetener,
    GlucoseFreeFood,
    Vitamin,
    MedicalGloves,
    Antiseptics
}