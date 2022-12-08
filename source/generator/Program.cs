using System.Text.Json;

var version = 34;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

var (projects, news, partners, thanks, slides_, stones) = 
    (ReadJ<Proj>("projects"), ReadJ<News>("news"), ReadJ<Entity>("partners"), ReadJ<Thanks>("thanks"), ReadJ<Slide>("slides"), ReadJ<Stone>("auction"));

T[] ReadJ<T>(string table) => JsonSerializer.Deserialize<T[]>(File.ReadAllText($"{rootPath}source/data/{table}.json"))!;

Render("ua");
Render("en");

void Render(string lang)
{
    string Read(string path)
    {
        var full = $"{rootPath}source/{path}.html";
        return File.ReadAllText(File.Exists(full) ? full : $"{rootPath}source/{lang}.{path}.html");
    }

    FastView View(string path) => new(Read(path));

    string Join<E>(FastView view, IEnumerable<Entity<E>> xs) => 
        string.Join("\n", xs.Select(e => view.Run(e, e.Loc(lang)!)));

    FastView master = View("master"), thank = View("thankCard"),
        newsCard = View("newsCard"), newsPage = View("newsPage"),
        projPage = View("projPage"), projCard = View("projectCard");

    string slides = Join(View("slide"), slides_),
        payDetails = Read("partners-pay"),
        otherNews = Join(newsCard, news.Take(2)),

        topThanks = Join(View("thankCardMain"), thanks.Take(4).Select((t, i) => t with { DesctopOnly = i == 3 })),
        
        topProjects = Join(projCard, projects.Take(6).Select((p, i) => p with { DesctopOnly = i > 3 }));

    void Out(string content, string enPath, object? arg = null, string? uaPath = null)
    {
        if (content.Length < 30)
            content = Read(content);
        if (arg is not null)
            content = new FastView(content).Run(arg);

        uaPath ??= enPath;
        var path = $"{rootPath}/{lang}{(lang is "en" ? enPath : uaPath)}/index.html";
        
        new FileInfo(path).Directory!.Create();
        File.WriteAllText(path, master.Run(new { content, enPath, uaPath, version, lang }));
    }

    var founders = View("founders").Run(new { partners = Join(View("partner"), partners) });
    Out("index", "", new { topProjects, payDetails, slides, topThanks });
    Out("center", "/center", new { payDetails, founders, skipAbout = true });
    Out("aboutus", "/aboutus", new { payDetails, founders });

    Out("thanks", "/thanks", new { content = Join(thank, thanks) });

    foreach (var page in "about-diabetes contacts founding-documents fun".Split(' '))
        Out(page, "/" + page);

    Out("projects", "/fundraising", new { FundsList = Join(projCard, projects) });

    foreach (var proj in projects)
        if (Read("projects/"+ proj.Id)!.Split("@projDoc") is [var contentF, var contentS])
        {
            var args = new { contentF, contentS, report = proj.ReportId is {} id ? Read("projects/"+id) : null };
            Out(projPage.Run(args, proj, proj.Loc(lang)), "/fundraising/" + proj.Id);
        }

    Out("news", "/news", new { Cards = Join(newsCard, news) });
    foreach (var nw in news)
    {
        var loc = nw.Loc(lang);
        var content = Read("news/"+ loc.Id);
        Out(newsPage.Run(nw, loc), "/news/"+nw.En.Id, new { otherNews, content }, "/news/"+nw.Ua.Id);
    }

    //Out("auction", "/auction", new { items = Join(View("auctionCard"), stones) });
    //Out("auctionDetail", "/detail");
}

record Entity<TLocale>()
{
    public required TLocale En { get; set; }
    public required TLocale Ua { get; set; }
    public string? Pic { get; set; }
    public string? MiniPic { get; set; }
    public bool DesctopOnly { get; set; }

    public TLocale Loc(string lang) => lang is "en" ? En : Ua;
}
record Entity : Entity<Locale>;

record Locale
{
    public required string Title { get; set; }
    public string? Descr { get; set; }
}

record NewsLoc(string Id) : Locale;

record News(string Date) : Entity<NewsLoc>;

record PayLoc(string? Data, string? Signature): Locale;

record Proj(string Id, int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf) : Entity<PayLoc>
{
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };
    public bool IsFull => Need == Funds;
    public string Url => Uri(Id);

    public static string Uri(string id) => id is "help-rehab" ? "center" : $"fundraising/{id}";
}

record Thanks(int? HRank = null) : Entity;

record Slide(int Index, string ProjectId, int DarkPerc) : Entity<PayLoc>
{
    public string Url => Proj.Uri(ProjectId);
}

record StoneLoc(string CertificateIntro) : Locale;

record Stone(string Id, string MiniLeft, string MiniRight) : Entity<StoneLoc>;