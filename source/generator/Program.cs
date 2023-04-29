using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

var version = 51;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

T[] ReadJ<T>(string table) where T : Item =>
    JsonSerializer.Deserialize<T[]>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project>("projects"), ReadJ<Item>("news"), ReadJ<Item>("partners"),
     ReadJ<Thanks>("thanks"), ReadJ<Slide>("slides"), ReadJ<Wallet>("wallets"),
     ReadJ<Stone>("auction"));


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

    var culture = CultureInfo.GetCultureInfo(lang)!;

    Func<Item, string> Printer(string viewPath, bool formatDate = false)
    {
        View view = new(Read(viewPath));
        return it => view.Run(
            it,
            it.GetLocale(lang),
            formatDate ? new { LocaleDate = it.Date.ToString("dd MMM yyyy", culture!.DateTimeFormat) } : null);
    }

    string Join<T>(string viewPath, IEnumerable<T> xs, bool formatDate = false) where T: Item =>
        string.Join("\n", xs.Select(Printer(viewPath, formatDate)));

    string ProjectCard(Project p)
    {
        var loc = lang is "en" ? p.En : p.Ua;
        return (loc.Promo is null ? projectCard : projectPromo).Run(p, loc);
    }

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
            projects.Take(6).Select((p, i) =>
                ProjectCard(p with { DesktopOnly = i > 3 }))),

        slides = Join("slide", slides),
        topThanks = Join("thankCardMain",
            from thank in thanks
            let index = thank.MainIndex
            where index.HasValue
            orderby index.Value
            select thank with { DesktopOnly = index.Value > 3 }),

        skipAbout = false,
        walletsTable
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", string.Join("\n", projects.Select(ProjectCard)));
    Out("news", "/news", Join("newsCard", news, true));
    Out("auction", "/auction", Join("auctionCard", stones));
    Out("auctionDetail", "/detail");

    Out("thanks", "/thanks", Join("thankCard",
        thanks.Where(t => 
        {
            if (t.Pic is not { } pic)
                return true;
            var span = pic.AsSpan();
            var id = byte.Parse(span[..span.IndexOf('.')]);
            return id < 154 || Thanks.Olds.Contains(id);
        }).Take(110)));

    

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    var projectView = Printer("projectPage");
    foreach (var project in projects)
            Out(projectView(project), "/fundraising/" + project.Id, new 
            {
                content = Read("projects/" + project.Id),
                walletsTable,
                report = project.ReportId is {} rep ? Read("projects/" + rep) : null                
            });


    var otherNews = Join("newsCard", news.Take(2), true);
    var newsView = Printer("newsPage", true);

    foreach (var props in news)
        Out(newsView(props), "/news/"+props.Id, new
        {
            content = Read("news/"+props.Id),
            otherNews
        });
}

record Locale
{
    public required string Title { get; set; }
    public string? Descr { get; set; }
}

record Item
{
    public string? Id { get; set; }
    public string? Pic { get; set; }
    public string? MiniPic { get; set; }
    public DateOnly Date { get; set; }
    public Locale En { get; set; }
    public Locale Ua { get; set; }

    public virtual Locale GetLocale(string lang) => lang is "en" ? En: Ua;
}

record Item<L> : Item where L : Locale 
{
    public required new L En { get; set; }
    public required new L Ua { get; set; }

    public override Locale GetLocale(string lang) => lang is "en" ? En : Ua;
}

record ProjectLoc(string? Data = null, string? Signature = null, string? Promo = null) : Locale;

record Project(int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf, bool DesktopOnly = false) : Item<ProjectLoc>
{
    public bool IsFull => Need == Funds;
    public bool IsInfinite => Need == 0;
    public string Url => UrlSegment(Id!);

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

record ThankLoc : Locale
{
    public string Name => Title is "" ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thanks(
    ThankTag[] Tags,
    int? Altitude = null,
    string? Video = null,
    int? MainIndex = null,
    bool DesktopOnly = false) : Item<ThankLoc>
{
    public string? Fallback => Pic?.Replace("avif", "jpg");

    public string Avatar => MiniPic ?? "zero.png";

    public string Alt => string.Join(", ", Alts());

    IEnumerable<string?> Alts()
    {
        foreach (var tag in Tags)
            yield return Enum.GetName(tag);
        yield return Pic;
    }

    public static ReadOnlySpan<byte> Olds => new byte[] { 193, 212, 182, 223, 197, 198, 166, 160 };
}

record Slide : Item<ProjectLoc>
{
    public string Url => Project.UrlSegment(Id!);
}

record Wallet(string Address, bool IsCrypto) : Item;

record StoneLoc(string CertificateIntro) : Locale;

record Stone(string MiniLeft, string MiniRight) : Item<StoneLoc>;