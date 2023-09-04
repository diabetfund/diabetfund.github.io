using System.Globalization;
using System.Text.Json;

var version = 57;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

List<T> ReadJ<T>() =>
    JsonSerializer.Deserialize<List<T>>(File.ReadAllText($"{rootPath}source/data/{typeof(T).Name}s.json"))!;

var (projects, news, partners, thanks, slides, wallets, stones) =
    (ReadJ<Project>(), ReadJ<News>(), ReadJ<Partner>(), ReadJ<Thank>(), ReadJ<Slide>(), ReadJ<Wallet>(), ReadJ<Stone>());

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