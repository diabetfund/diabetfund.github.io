using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

var version = 53;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

List<T> ReadJ<T>(string table) =>
    JsonSerializer.Deserialize<List<T>>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project>("projects"), ReadJ<News>("news"), ReadJ<Item<List<string>>>("partners"), ReadJ<Thanks>("thanks"),
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

    var culture = CultureInfo.GetCultureInfo(lang is "ua" ? "uk" : "en")!;

    void AddLocaleItem<T>(List<T> xs, Func<T, string, string> create) where T : Item
    {
        foreach (var item in xs)
            if (item.Locale(lang) is List<string> loc)
                loc.Add(create(item, loc[0]));
    }
    AddLocaleItem(thanks, (_, name) => name is "" ? "" : "&nbsp;" + name + "&nbsp;");

    AddLocaleItem(news, (nw, _) => nw.Date.ToString("dd MMM yyyy", culture!.DateTimeFormat));


    string Join<T>(string viewPath, IEnumerable<T> xs) where T : Item
    {
        View view = new(Read(viewPath));
        return string.Join("\n", xs.Select(x => view.Run(x, x.Locale(lang))));
    }

    string ProjectCard(Project p) =>
        (p.Locale(lang) is ProjectTopic { Promo: null } ? projectCard : projectPromo).Run(p, p.Locale(lang));

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
            projects.Take(6).Select((p, i) => ProjectCard(p with { DesktopOnly = i > 3 }))),

        slides = Join("slide", slides),
        topThanks = Join("thankCardMain",
            thanks.Where(_ => _.MainIndex.HasValue)
                  .OrderBy(_ => _.MainIndex)
                  .Select((t, i) => t with { DesktopOnly = i > 2 })),

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

    if (Thanks.Debug)
        Out("thanks", "/thanks", Join("thankCard", thanks));
    else
    {
        var thanksPages = thanks.Chunk(40).ToArray();
        for (var i = 0; i < thanksPages.Length; i++)
        {
            var content = Join("thankCard", thanksPages[i]);
            File.WriteAllText($"{rootPath}/{lang}/thanksChunk{i + 1}.html", content);

            var hasNext = i < thanksPages.Length - 1;
            int? nextPage = hasNext ? i + 2 : null;

            if (i == 0)
                Out("thanks", "/thanks", new { content, nextPage, hasNext });
            else
                Out("thanks", $"/thanks-{i + 1}", new { content, nextPage, hasNext });
        }
    }

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    View projectView = new(Read("projectPage"));
    foreach (var p in projects)
        Out(projectView.Run(p, p.Locale(lang)), "/fundraising/" + p.Id, new
        {
            content = Read("projects/" + p.Id),
            walletsTable,
            report = p.ReportId is { } rep ? Read("projects/" + rep) : null
        });

    var otherNews = Join("newsCard", news.Take(2));
    View newsView = new(Read("newsPage"));

    foreach (var props in news)
        Out(newsView.Run(props, props.Locale(lang)), "/news/" + props.Id, new
        {
            content = Read("news/" + props.Id),
            otherNews
        });
}

record Item
{
    public object? En { get; set; }
    public object? Ua { get; set; }

    public virtual object? Locale(string lang) => lang is "en" ? En : Ua;
}

record Item<TId, TLocale> : Item 
{
    public TId Id { get; set; }
    public new TLocale En { get; set; }
    public new TLocale Ua { get; set; }

    public override object? Locale(string lang) => lang is "en" ? En : Ua;
}

record Item<TTopic> : Item<string, TTopic>;

record ProjectTopic(string Title, string Text, string? Data, string? Signature, string? Promo);

record Project(int Need, int Funds, bool IsMilitary, bool DesktopOnly, string? ReportId, string? Pic, string Pdf) : Item<ProjectTopic>
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
    Sweet, Meter, Libre, Medtronic, Strips, Insulin, Vitamin, P999, Quality,
    Old, BedRidden, NoHead, Man, NoBody, Adult, Special, Small, Collage
}

record Thanks(
    ThankTag[] Tags,
    int? Altitude,
    string? Video,
    string? Avatar,
    int? MainIndex,
    DateOnly Date,
    bool DesktopOnly) : Item<int, List<string>>
{
    public string ZeroOrAvatar =>
        Avatar is null ? "zero.png" : Avatar.EndsWith("webp") ? Avatar.Replace("webp", "png") : Avatar;

    public string ModernAvatar => Avatar ?? "zero.webp";

    public string? Alt => Debug ?  string.Join(", ", Alts()): "";

    IEnumerable<string?> Alts()
    {
        foreach (var tag in Tags)
            yield return Enum.GetName(tag);
        yield return Id.ToString();
    }

    public static bool Debug = false;

    public static ReadOnlySpan<byte> Olds => new byte[] { 193, 212, 182, 223, 197, 198, 166, 160 };
}

record Slide(string Pic) : Item<string>
{
    public string Url => Project.UrlSegment(Id);
}

record Wallet(string Address, bool IsCrypto) : Item<int, string>;

record News(DateOnly Date) : Item<List<string>>
{
    public string JsonDate => Date.ToString("o");
}

record StoneTopic(string Title, string Text, string CertificateIntro);

record Stone(string MiniLeft, string MiniRight) : Item<string, StoneTopic>;