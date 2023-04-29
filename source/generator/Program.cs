using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

var version = 51;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

T[] ReadJ<T>(string table) where T : Item =>
    JsonSerializer.Deserialize<T[]>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project>("projects"), ReadJ<News>("news"), ReadJ<Item>("partners"), ReadJ<Thanks>("thanks"),
     ReadJ<Slide>("slides"), ReadJ<Wallet>("wallets"), ReadJ<Stone>("auction"));

Render("ua");
Render("en");

void Render(string lang)
{
    string Read(string path)
    {
        var full = $"{rootPath}source/{path}.html";
        return File.ReadAllText(File.Exists(full) ? full : $"{rootPath}source/{lang}/{path}.html");
    }
    View master = new(Read("master")),
        projectCard = new(Read("projectCard")),
        projectPromo = new(Read("projectPromo"));

    void Out(string content, string subPath, object? arg = null)
    {
        if (content.Length < 30)
            content = Read(content);
        if (arg is not null)
            content = new View(content).Run(arg);

        var path = $"{rootPath}/{lang}{subPath}/index.html";
        new FileInfo(path).Directory!.Create();
        File.WriteAllText(path, master.Run(new { content, subPath, version, lang }));
    }

    PrinterProps newsProps = new(it => (it as News)!.Date);
    var culture = CultureInfo.GetCultureInfo(lang is "ua" ? "uk" : "en")!;

    Func<Item, int, string> Printer(string viewPath, PrinterProps props = default)
    {
        View view = new(Read(viewPath));
        return (it, i) => view.Run(it, it.Locale(lang), props.LocDate(it, culture), props.DesktopOnly(i));
    }

    string Join<T>(string viewPath, IEnumerable<T> xs, PrinterProps props = default) where T : Item =>
        string.Join("\n", xs.Select(Printer(viewPath, props)));

    Func<Project, int, string> ProjectCard(PrinterProps props = default) => (p, i) =>
        (p.Locale(lang) is ProjectTopic { Promo: null } ? projectCard : projectPromo)
            .Run(p, p.Locale(lang), props.DesktopOnly(i, true));

    var walletsTable = new View(Read("wallets")).Run(new
    {
        bank = Join("wallet-line", wallets.Where(_ => !_.IsCrypto)),
        crypto = Join("wallet-line", wallets.Where(_ => _.IsCrypto))
    });
    var common = new
    {
        founders = new View(Read("founders")).Run(Join("partner", partners)),
        payDetails = new View(Read("partners-pay")).Run(walletsTable),

        topProjects = string.Join("\n",
            projects.Take(6).Select(ProjectCard(new(desktopOnly: i => i > 3)))),

        slides = Join("slide", slides),
        topThanks = Join("thankCardMain",
            thanks.Where(_=>_.MainIndex.HasValue).OrderBy(_ => _.MainIndex),
            new(desktopOnly: i => i > 2)),

        skipAbout = false,
        walletsTable
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", string.Join("\n", projects.Select(ProjectCard())));

    Out("news", "/news", Join("newsCard", news, newsProps));
    Out("auction", "/auction", Join("auctionCard", stones));
    Out("auctionDetail", "/detail");

    Out("thanks", "/thanks", Join("thankCard",
        thanks.Where(t => t.Id.AsNumber() < 154 || Thanks.Olds.Contains((byte)t.Id.AsNumber())).Take(110)));

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    var projectView = Printer("projectPage");
    foreach (var project in projects)
        Out(projectView(project, 0), "/fundraising/" + project.Id, new
        {
            content = Read("projects/" + project.Id),
            walletsTable,
            report = project.ReportId is { } rep ? Read("projects/" + rep) : null
        });

    var otherNews = Join("newsCard", news.Take(2), newsProps);
    var newsView = Printer("newsPage", newsProps);

    foreach (var props in news)
        Out(newsView(props, 0), "/news/" + props.Id, new
        {
            content = Read("news/" + props.Id),
            otherNews
        });
}

readonly struct PrinterProps(Func<Item, DateOnly>? getDate = null, Func<int, bool>? desktopOnly = null)
{
    public object? LocDate(Item it, CultureInfo culture) =>
        getDate is null ? null : new { LocaleDate = getDate(it).ToString("dd MMM yyyy", culture!.DateTimeFormat) };

    public object? DesktopOnly(int index, bool force = false) =>
        desktopOnly is null 
        ? force ? new { DesktopOnly = false } : null
        : new { DesktopOnly = desktopOnly(index) };
}

record Item
{
    public Id Id { get; set; }
    public Topic En { get; set; }
    public Topic Ua { get; set; }

    public virtual Topic Locale(string lang) => lang is "en" ? En : Ua;
}

record Item<L> : Item where L : Topic
{
    public required new L En { get; set; }
    public required new L Ua { get; set; }

    public override Topic Locale(string lang) => lang is "en" ? En : Ua;
}

record ProjectTopic(string? Data, string? Signature, string? Promo) : Topic;

record Project(int Need, int Funds, bool IsMilitary, string? ReportId, string? Pic, string Pdf) : Item<ProjectTopic>
{
    public bool IsFull => Need == Funds;
    public bool IsInfinite => Need == 0;
    public string Url => UrlSegment(Id.ToString());

    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    public static string UrlSegment(string id) =>
        id is "help-rehab" ? "center" : $"fundraising/{id}";
}

[JsonConverter(typeof(JsonStringEnumConverter))]
enum ThankTag
{
    Sweet, Meter, Libre, Medtronic, Insulin, P999, Cat,
    Old, BedRidden, NoHead, Man, NoBody, Adult, Special, Small
}

[JsonConverter(typeof(TopicConverter<ThankTopic>))]
record ThankTopic : Topic
{
    public string Name => Title is "" ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thanks(ThankTag[] Tags, int? Altitude, string? Video, string? Avatar, int? MainIndex, DateOnly Date) : Item<ThankTopic>
{
    public string ZeroOrAvatar => Avatar ?? "zero.png";

    //public string Alt => string.Join(", ", Alts());

    IEnumerable<string?> Alts()
    {
        foreach (var tag in Tags)
            yield return Enum.GetName(tag);
        yield return Id.ToString();
    }

    public static ReadOnlySpan<byte> Olds => new byte[] { 193, 212, 182, 223, 197, 198, 166, 160 };
}

record Slide(string Pic) : Item
{
    public string Url => Project.UrlSegment(Id.ToString());
}

record Wallet(string Address, bool IsCrypto) : Item;

record News(DateOnly Date): Item;

record StoneTopic(string CertificateIntro) : Topic;

record Stone(string MiniLeft, string MiniRight) : Item<StoneTopic>;