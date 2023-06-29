using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

var version = 56;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

List<T> ReadJ<T>(string? table = null) =>
    JsonSerializer.Deserialize<List<T>>(
        File.ReadAllText($"{rootPath}source/data/{table ?? typeof(T).Name.ToLower() + "s"}.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project>(), ReadJ<News>(), ReadJ<Partner>(), ReadJ<Thank>(),
     ReadJ<Slide>(), ReadJ<Wallet>(), ReadJ<Stone>());

WriteFolder("ua");
WriteFolder("en");

void WriteFolder(string lang)
{
    string Read(string path)
    {
        var full = $"{rootPath}source/{path}.html";
        return File.ReadAllText(File.Exists(full) ? full : $"{rootPath}source/{lang}/{path}.html");
    }

    var print = PrinterFactory.Create(Read, lang);

    void Out(string arg, string subPath, object? model = null)
    {
        var path = $"{rootPath}/{lang}{subPath}/index.html";
        new FileInfo(path).Directory!.Create();

        var master = new { content = print(model, arg), subPath, version, lang };
        File.WriteAllText(path, print(master));
    }

    var culture = CultureInfo.GetCultureInfo(lang is "ua" ? "uk" : "en")!;
    var localNews = news.ConvertAll(nw => nw with
    {
        LocaleDate = nw.Date.ToString("dd MMM yyyy", culture.DateTimeFormat)
    });

    string ProjectCards(IEnumerable<Project> projects, bool setDesktop) =>
        string.Join('\n', projects.Select((project, i) =>
            print(
                project with { DesktopOnly = setDesktop && i > 3 },
                "project" + (project.Locale(lang) is ProjectTopic { Promo: null } ? "Card" : "Promo")
            )));

    var walletsTableContent = new
    {
        bank = print(wallets.Where(_ => !_.IsCrypto)),
        crypto = print(wallets.Where(_ => _.IsCrypto))
    };
    var walletsTable = print(walletsTableContent);
    var founders = print(partners);
    
    var thanksMain =
        from thank in thanks
        let index = thank.MainIndex.GetValueOrDefault()
        where index > 0 orderby index
        select thank with { DesktopOnly = index > 3 };

    var common = new
    {
        founders = print(founders),
        payDetails = print(walletsTable),
        slides = print(slides),
        topThanks = print(thanksMain),
        skipAbout = false,
        walletsTable,
        topProjects = ProjectCards(projects.Take(6), true)
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", ProjectCards(projects, false));

    Out("news", "/news", print(localNews));
    Out("auction", "/auction", print(stones));
    Out("auctionDetail", "/detail");

    if (Thank.Debug)
        Out("thankList", "/thanks", print(thanks));
    else
        _ = thanks.Chunk(40).Select((thanks, i) =>
        {
            var content = print(thanks);
            File.WriteAllText($"{rootPath}/{lang}/thanksChunk{i + 1}.html", content);

            var hasNext = thanks.Length == 40;
            var nextPage = hasNext ? i + 2 : (int?)null;
            Out("thankList", i == 0 ? "/thanks" : $"/thanks-{i + 1}", new { content, nextPage, hasNext });
            return i;
        })
        .ToList();

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    foreach (var projectPage in projects)
        Out(print(projectPage), "/fundraising/" + projectPage.Id, new
        {
            content = Read("projects/" + projectPage.Id),
            walletsTable,
            report = projectPage.ReportId is {} rep ? Read("projects/" + rep) : null
        });

    var otherNews = print(localNews.Take(2));
    
    foreach (var newsPage in localNews)
        Out(print(newsPage), "/news/" + newsPage.Id, new
        {
            content = Read("news/" + newsPage.Id),
            otherNews
        });
}

record Item<T> : ILocalized
{
    public required string Id { get; set; }
    public T? En { get; set; }
    public T? Ua { get; set; }
    public T? De { get; set; }
    public T? It { get; set; }
    public T? Pl { get; set; }

    public object? Locale(string lang) =>
        lang switch { "ua" => Ua, "it" => It, "de" => De, "pl" => Pl, _=> default }
        ?? En;
}

record Topic
{
    public string? Title { get; set; }
    public string? Text { get; set; }
}

record Partner : Item<Topic>;

record ProjectTopic(string? Data, string? Signature, string? Promo): Topic;

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
    public string Sign => 
        string.IsNullOrEmpty(Title) ? "" : "&nbsp;" + Title + "&nbsp;";
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

    public string Alt => Debug ?  string.Join(", ", Alts()): "";

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

record StoneTopic(string CertificateIntro): Topic;

record Stone(string MiniLeft, string MiniRight) : Item<StoneTopic>;