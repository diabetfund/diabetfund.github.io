using System.Text.Json;
using System.Text.Json.Serialization;

var version = 50;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

Item<P, L>[] ReadJ<P, L>(string table) =>
    JsonSerializer.Deserialize<Item<P, L>[]>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project, ProjectLoc>("projects"), ReadJ<News, Locale>("news"), ReadJ<Props, Locale>("partners"),
     ReadJ<Thanks, ThankLoc>("thanks"), ReadJ<Slide, ProjectLoc>("slides"), ReadJ<Wallet, Locale>("wallets"),
     ReadJ<Stone, StoneLoc>("auction"));


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

    string Join<P, L>(string viewPath, IEnumerable<Item<P, L>> xs)
    {
        View view = new(Read(viewPath));
        return string.Join("\n", xs.Select(it => view.Run(it.Props!, lang is "en" ? it.En : it.Ua)));
    }

    string ProjectCard(Item<Project, ProjectLoc> p)
    {
        var loc = lang is "en" ? p.En : p.Ua;
        return (loc.Promo is null ? projectCard : projectPromo).Run(p.Props, loc);
    }

    var walletsTable = new View(Read("wallets")).Run(new
    {
        bank = Join("wallet-line", wallets.Where(_ => !_.Props.IsCrypto)),
        crypto = Join("wallet-line", wallets.Where(_ => _.Props.IsCrypto))
    });
    var common = new
    {
        founders = new View(Read("founders")).Run(Join("partner", partners)),
        payDetails = new View(Read("partners-pay")).Run(walletsTable),

        topProjects = string.Join("\n",
            projects.Take(6).Select((p, i) =>
                ProjectCard(p with { Props = p.Props with { DesktopOnly = i > 3 } }))),

        slides = Join("slide", slides),
        topThanks = Join("thankCardMain",
            from thank in thanks
            let index = thank.Props.MainIndex
            where index.HasValue
            orderby index.Value
            select thank with { Props = thank.Props with { DesktopOnly = index.Value > 3 } }),

        skipAbout = false,
        walletsTable
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", string.Join("\n", projects.Select(ProjectCard)));
    Out("news", "/news", Join("newsCard", news));
    Out("auction", "/auction", Join("auctionCard", stones));
    Out("auctionDetail", "/detail");

    Out("thanks", "/thanks", Join("thankCard",
        thanks.Where(t => 
        {
            if (t.Props.Pic is not { } pic)
                return true;
            var span = pic.AsSpan();
            return int.Parse(span[..span.IndexOf('.')]) < 158;
        }).Take(110)));

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    IEnumerable<(P, string, string)> ItemPages<P, L>(Item<P, L>[] items, string viewPath, string cardsPath) where P: Props
    {
        View view = new(Read(viewPath));
        foreach (var (props, en, ua) in items)
            yield return (props, Read(cardsPath + props.Id!), view.Run(props, lang is "en" ? en : ua));
    }

    foreach (var (props, content, view) in ItemPages(projects, "projectPage", "projects/"))
            Out(view, "/fundraising/" + props.Id, new 
            {
                content,
                walletsTable,
                report = props.ReportId is {} rep ? Read("projects/" + rep) : null                
            });

    var otherNews = Join("newsCard", news.Take(2));

    foreach (var (props, content, view) in ItemPages(news, "newsPage", "news/"))
        Out(view, "/news/"+props.Id, new { content, otherNews });
}

record Item<P, L>(P Props, L En, L Ua);

record Props
{
    public string? Id { get; set; }
    public string? Pic { get; set; }
    public string? MiniPic { get; set; }
    public bool DesktopOnly { get; set; }
}

record Locale
{
    public required string Title { get; set; }
    public string? Descr { get; set; }
}

record News(string Date) : Props;

record ProjectLoc(string? Data = null, string? Signature = null, string? Promo = null) : Locale;

record Project(int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf) : Props
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
    Sweet, Meter, Libre, Medtronic, Insulin, P999,
    Old, NoHead, Man, NoBody, Adult, Special, Small
}

record ThankLoc : Locale
{
    public string Name => Title is "" ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thanks(
    DateOnly Date,
    ThankTag[] Tags,
    int? HRank = null,
    string? Video = null,
    int? MainIndex = null) : Props 
{
    public string? Fallback => Pic?.Replace("avif", "jpg");

    public string Avatar => MiniPic ?? "zero.png";
}

record Slide : Props
{
    public string Url => Project.UrlSegment(Id!);
}

record Wallet(string Address, bool IsCrypto) : Props;

record StoneLoc(string CertificateIntro) : Locale;

record Stone(string MiniLeft, string MiniRight) : Props;