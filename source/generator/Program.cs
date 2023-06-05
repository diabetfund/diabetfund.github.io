using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

var version = 56;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

List<T> ReadJ<T>(string table) =>
    JsonSerializer.Deserialize<List<T>>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

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

    var print = new Printer(Read, lang);

    void Out(string arg, string subPath, object? model = null) =>
        Printer.WriteFile(
            $"{rootPath}/{lang}{subPath}/index.html",
            print["master", new { content = print[arg, model], subPath, version, lang }]);

    var culture = CultureInfo.GetCultureInfo(lang is "ua" ? "uk" : "en")!;
    var localNews = news.ConvertAll(nw => nw with
    {
        LocaleDate = nw.Date.ToString("dd MMM yyyy", culture.DateTimeFormat)
    });

    string ProjectCard(Project project) =>
        print[
            project.Locale(lang) is ProjectTopic { Promo: null } ? "projectCard" : "projectPromo", 
            project
        ];

    var walletsTable = print["wallets", new
    {
        bank = print["wallet-line", wallets.Where(_ => !_.IsCrypto)],
        crypto = print["wallet-line", wallets.Where(_ => _.IsCrypto)]
    }];
    var common = new
    {
        founders = print["founders", print["partner", partners]],
        payDetails = print["partners-pay", walletsTable],

        topProjects = string.Join("\n",
            projects.Take(6).Select((p, i) => ProjectCard(p with { DesktopOnly = i > 3 }))),

        slides = print["slide", slides],
        topThanks = print["thankCardMain",
            thanks.Where(_ => _.MainIndex.HasValue)
                  .OrderBy(_ => _.MainIndex)
                  .Select((thank, i) => thank with { DesktopOnly = i > 2 })],

        skipAbout = false,
        walletsTable
    };
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", string.Join("\n", projects.Select(ProjectCard)));

    Out("news", "/news", print["newsCard", localNews]);
    Out("auction", "/auction", print["auctionCard", stones]);
    Out("auctionDetail", "/detail");

    var thanksPages = thanks.Chunk(40).ToArray();
    if (Thanks.Debug)
        Out("thanks", "/thanks", print["thankCard", thanks]);
    else
        for (var i = 0; i < thanksPages.Length; i++)
        {
            var content = Printer.WriteFile(
                $"{rootPath}/{lang}/thanksChunk{i + 1}.html",
                print["thankCard", thanksPages[i]]);

            var hasNext = i < thanksPages.Length - 1;
            var nextPage = hasNext ? i + 2 : (int?)null;
            Out("thanks", i == 0 ? "/thanks" : $"/thanks-{i + 1}", new { content, nextPage, hasNext });
        }
    
    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    foreach (var project in projects)
        Out(print["projectPage", project], "/fundraising/" + project.Id, new
        {
            content = Read("projects/" + project.Id),
            walletsTable,
            report = project.ReportId is {} rep ? Read("projects/" + rep) : null
        });

    var otherNews = print["newsCard", localNews.Take(2)];
    
    foreach (var props in localNews)
        Out(print["newsPage", props], "/news/" + props.Id, new
        {
            content = Read("news/" + props.Id),
            otherNews
        });
}

record Topic
{
    public string? Title { get; set; }
    public string? Text { get; set; }
}

record Item<TTopic> : ILocalized
{
    public required string Id { get; set; }
    public TTopic? En { get; set; }
    public TTopic? Ua { get; set; }

    public object? Locale(string lang) => lang is "en" ? En : Ua;
}

record Item : Item<Topic>;

record ProjectTopic(string? Data, string? Signature, string? Promo): Topic;

record Project(
    int Need,
    int Funds,
    bool IsMilitary,
    bool DesktopOnly,
    string? ReportId,
    string? Pic,
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
    Sweet, Meter, Libre, Medtronic, Strips, Insulin, Vitamin, P999, Reservoir, Pods,
    Old, Man, Teen, Adult, Infant,
    Cat, Compose, AnimaAnimus, BedRidding, Collage, NoHead, NoBody, LowQuality, HighQuality
}

record ThankTopic : Topic
{
    public string Sign => 
        string.IsNullOrEmpty(Title) ? "" : "&nbsp;" + Title + "&nbsp;";
}

record Thanks(
    ThankTag[] Tags,
    int? Altitude,
    string? Video,
    string? Avatar,
    int? MainIndex,
    DateOnly Date,
    bool DesktopOnly) : Item<ThankTopic>
{
    public string ZeroOrAvatar =>
        Avatar is null ? "zero.png"
        : Avatar.EndsWith("webp") ? Avatar.Replace("webp", "png")
        : Avatar;

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

record News(DateOnly Date) : Item
{
    public string JsonDate => Date.ToString("o");
    public string? LocaleDate { get; set; }
}

record StoneTopic(string CertificateIntro): Topic;

record Stone(string MiniLeft, string MiniRight) : Item<StoneTopic>;