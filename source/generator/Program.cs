using System.Text.Json;

var version = 31;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

var (projects, news, partners, thanks, slides_) = 
    (ReadJ<Proj>("projects"), ReadJ<News>("news"), ReadJ<Entity>("partners"), ReadJ<Thanks>("thanks"), ReadJ<Slide>("slides"));

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

    string Join<E>(View view, IEnumerable<Entity<E>> xs) =>
        string.Join("\n", xs.Select(e => view.Run(e, e.Entry(lang)!)));

    View master = new(Read("master")), thank = new(Read("thankCard")), thankMain = new(Read("thankCardMain")),
        newsCard = new(Read("newsCard")), newsPage = new(Read("newsPage")),
        projPage = new(Read("projPage")), projCard = new(Read("projectCard"));

    string slides = Join(new(Read("slide")), slides_),
        payDetails = Read("partners-pay"),
        otherNews = Join(newsCard, news.Take(2)),

        topThanks = Join(thankMain, thanks.Take(4).Select((t, i) => t with { DesctopOnly = i == 3 })),
        
        topProjects = Join(projCard, projects.Take(6).Select((p, i) => p with { DesctopOnly = i > 3 }));

    void Out(string content, string enPath, object? arg = null, string? uaPath = null)
    {
        if (content.Length < 30)
            content = Read(content);
        if (arg is not null)
            content = new View(content).Run(arg);

        uaPath ??= enPath;
        var path = $"{rootPath}/{lang}{(lang is "en" ? enPath : uaPath)}/index.html";
        
        new FileInfo(path).Directory!.Create();
        File.WriteAllText(path, master.Run(new { content, enPath, uaPath, version, lang }));
    }

    var founders = new View(Read("founders")).Run(new
    {
        partners = Join(new(Read("partner")), partners)
    });
    Out("index", "", new { topProjects, payDetails, slides, topThanks });
    Out("center", "/center", new { payDetails, founders, skipAbout = true });
    Out("aboutus", "/aboutus", new { payDetails, founders });

    Out(Read("thanks"), "/thanks", new { content = Join(thank, thanks) });

    foreach (var page in "about-diabetes contacts founding-documents fun".Split(' '))
        Out(page, "/" + page);

    Out(Read("projects"), "/fundraising", new { FundsList = Join(projCard, projects) });

    foreach (var proj in projects)
        if (Read("projects/" + proj.Id).Split("@projDoc") is [var contentF, var contentS])
        {
            var args = new { contentF, contentS, report = proj.ReportId is {} id ? Read("projects/"+id) : null };
            Out(projPage.Run(args, proj, proj.Entry(lang)), "/fundraising/" + proj.Id);
        }
    
    Out(Read("news"), "/news", new { Cards = Join(newsCard, news) });

    foreach (var nw in news)
    {
        var loc = nw.Entry(lang);
        var content = Read("news/" + loc.Id);
        Out(newsPage.Run(nw, loc), "/news/"+nw.En.Id, new { otherNews, content }, "/news/"+nw.Ua.Id);
    }
}

record Entity<TEntry>()
{
    public required TEntry En { get; set; }
    public required TEntry Ua { get; set; }
    public string? Pic { get; set; }
    public string? MiniPic { get; init; }
    public bool DesctopOnly { get; set; }

    public TEntry Entry(string lang) => lang is "en" ? En : Ua;
}
record Entity : Entity<Entry>;

record Entry
{
    public required string Title { get; init; }
    public string? Descr { get; init; }
}

record NewsEntry(string Id) : Entry;

record News(string Date) : Entity<NewsEntry>;

record PayEntry(string? Data, string? Signature): Entry;

record Proj(string Id, int Need, int Funds, bool IsMilitary, string? ReportId, string Pdf) : Entity<PayEntry>
{
    public int FundPerc => (int)((double)Funds / (double)Need * 100.0);
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };
    public bool IsFull => Need == Funds;
    public string Url => Uri(Id);

    public static string Uri(string id) => id is "help-rehab" ? "center" : $"fundraising/{id}";
}

record Thanks(int? HRank = null) : Entity;

record Slide(int Index, string ProjectId, int DarkPerc) : Entity<PayEntry>
{
    public string Url => Proj.Uri(ProjectId);
}