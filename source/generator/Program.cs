using System.Text.Json;

var version = 41;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

Item<P, L>[] ReadJ<P, L>(string table) =>
    JsonSerializer.Deserialize<Item<P, L>[]>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Proj, PayLoc>("projects"), ReadJ<News, Locale>("news"), ReadJ<Props, Locale>("partners"),
     ReadJ<Thanks, Locale>("thanks"), ReadJ<Slide, PayLoc>("slides"), ReadJ<Wallet, Locale>("wallets"),
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
    View master = new(Read("master"));

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

    var walletsTable = new View(Read("wallets")).Run(new
    {
        bank = Join("wallet-line", wallets.Where(_ => !_.Props.IsCrypto)),
        crypto = Join("wallet-line", wallets.Where(_ => _.Props.IsCrypto))
    });
    var common = new
    {
        founders = new View(Read("founders")).Run(Join("partner", partners)),
        payDetails = new View(Read("partners-pay")).Run(walletsTable),
        topProjects = Join("projectCard", projects.Take(6).Select((p, i) => p with { Props = p.Props with { DesctopOnly = i > 3 } })),
        slides = Join("slide", slides),
        topThanks = Join("thankCardMain", thanks.Take(4).Select((t, i) => t with { Props = t.Props with { DesctopOnly = i == 3 } })),
        skipAbout = false,
        walletsTable
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", Join("projectCard", projects));
    Out("thanks", "/thanks", Join("thankCard", thanks));
    Out("news", "/news", Join("newsCard", news));
    Out("auction", "/auction", Join("auctionCard", stones));
    Out("auctionDetail", "/detail");

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    IEnumerable<(P, string, string)> ItemPages<P, L>(Item<P, L>[] items, string viewPath, string cardsParth) where P: Props
    {
        View view = new(Read(viewPath));
        foreach(var (props, en, ua) in items)
            yield return (props, Read(cardsParth+ props.Id!), view.Run(props, lang is "en" ? en : ua));
    }

    foreach (var (props, content, view) in ItemPages(projects, "projPage", "projects/"))
        if (content.Split("<hr/>") is [var contentF, var contentS])
            Out(view, "/fundraising/" + props.Id, new 
            {
                contentF, contentS, 
                report = props.ReportId is { } rep ? Read("projects/" + rep) : null
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
    public bool DesctopOnly { get; set; }
}

record Locale
{
    public required string Title { get; set; }
    public string? Descr { get; set; }
}

record News(string Date) : Props;

record PayLoc(string? Data, string? Signature): Locale;

record Proj(int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf) : Props
{
    public bool IsFull => Need == Funds;
    public bool IsInfinite => Need == 0;
    public string Url => UrlSegment(Id!);

    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);

    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };

    public static string UrlSegment(string id) => id is "help-rehab" ? "center" : $"fundraising/{id}";
}

record Thanks(int? HRank = null, string? Video = null) : Props;

record Slide(string ProjectId, int DarkPerc) : Props
{
    public string Url => Proj.UrlSegment(ProjectId);
}

record Wallet(string Address, bool IsCrypto) : Props;

record StoneLoc(string CertificateIntro) : Locale;

record Stone(string MiniLeft, string MiniRight) : Props;