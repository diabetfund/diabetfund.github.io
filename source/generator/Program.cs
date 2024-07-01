using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Simplicity;
using Simplicity.StaticSite;

var version = 60;
var rootPath = Environment.CurrentDirectory.Split("source")[0];
JsonSerializerOptions jsonOpts = new()
{ 
    IncludeFields=true,
    Converters = { new JsonStringEnumConverter() }
};

List<T> ReadJ<T>()
{
    using var stream = File.OpenRead($"{rootPath}source/data/{typeof(T).Name}s.json");
    return JsonSerializer.Deserialize<List<T>>(stream, jsonOpts)!;
}

var (projects, news_, partners, grates, slides, wallets, stones) =
    (ReadJ<Project>(), ReadJ<News>(), ReadJ<Partner>(), ReadJ<Thank>(),
     ReadJ<Slide>(), ReadJ<Wallet>(), ReadJ<Stone>());

slides = slides.FindAll(_=>_.Key != "assistance-to-zsu");
projects = projects.FindAll(_=> _.Type != ProjectType.Military);

foreach(var langId in new[] { Language.English, Language.Ukrainian, Language.German, Language.Polish })
{
    var culture = CultureInfo.GetCultureInfo(langId);
    var lang = culture.TwoLetterISOLanguageName;
    if (lang == "uk")
        lang = "ua";

    string Read(string path)
    {
        string full = $"{rootPath}source/{path}.html";
        return File.ReadAllText(File.Exists(full) ? full : $"{rootPath}source/{lang}/{path}.html");
    }

    Printer print = new(Read, culture);

    void Out(string arg, string subPath, object? model = null)
    {
        var path = $"{rootPath}/{lang}{subPath}/index.html";
        new FileInfo(path).Directory!.Create();

        var master = new { content = print[model, arg], subPath, version, lang };
        File.WriteAllText(path, print[master]);
    }

    string ProjectCards(IEnumerable<Project> projects, bool setDesktop) =>
        string.Join('\n', projects.Select((project, i) =>
            print[
                project with { DesktopOnly = setDesktop && i > 3 },
                "project" + (project.GetLocalized(culture) is ProjectTopic { PromoVideo: null } ? "Card" : "Promo")
            ]));

    var news = news_.ConvertAll(item => item with
    {
        LocaleDate = item.Date.ToString("dd MMM yyyy", culture.DateTimeFormat)
    });

    var walletsTableContent = new
    {
        bank = print[wallets.Where(_ => !_.IsCrypto)],
        crypto = print[wallets.Where(_ => _.IsCrypto)]
    };
    var walletsTable = print[walletsTableContent];
    var founders = print[partners];
    
    var thanksMain =
        from thank in grates
        let index = thank.MainIndex.GetValueOrDefault()
        where index > 0 orderby index
        select thank with { DesktopOnly = index > 3 };

    var common = new
    {
        founders = print[founders],
        payDetails = print[walletsTable],
        slides = print[slides],
        topThanks = print[thanksMain],
        skipAbout = false,
        walletsTable,
        topProjects = ProjectCards(projects.Take(6), true)
    };
    Out("newsList", "/news", print[news]);
    Out("auction", "/auction", print[stones]);
    Out("auctionDetail", "/detail");
    Out("center", "/center", common with { skipAbout = true });
    Out("aboutus", "/aboutus", common);
    Out("index", "", common);
    Out("projects", "/fundraising", ProjectCards(projects, false));

    foreach (var (i, thanks) in grates.Chunk(40).Index())
    {
        var content = print[thanks];
        File.WriteAllText($"{rootPath}/{lang}/thanksChunk{i + 1}.html", content);

        bool hasNext = thanks.Length == 40;
        int? nextPage = hasNext ? i + 2 : null;
        Out("thankList", i == 0 ? "/thanks" : $"/thanks-{i + 1}", new { content, nextPage, hasNext });
    }

    foreach (var page in "about-diabetes contacts founding-documents fun recipient-quest".Split(' '))
        Out(page, "/" + page);

    foreach (var projectPage in projects)
        Out(print[projectPage], "/fundraising/" + projectPage.Key, new { walletsTable });

    var otherNews = print[news.Take(2)];
    
    foreach (var newsPage in news)
        Out(print[newsPage], "/news/" + newsPage.Key, new { otherNews });
}