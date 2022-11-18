using System.Text.Json;

var version = 22;
var rootPath = Environment.CurrentDirectory.Split("source")[0];

var (projects, news, partners, thanks, slides_) = 
    (ReadJ<Proj>("projects"), ReadJ<News>("news"), ReadJ<Entity>("partners"), ReadJ<Thanks>("thanks"), ReadJ<Slide>("slides"));

T[] ReadJ<T>(string subp) => JsonSerializer.Deserialize<T[]>(File.ReadAllText($"{rootPath}source/{subp}.json"))!;

Render("ua");
Render("en");

void Render(string lang)
{
    string ReadComm(string path, string folder = "common") => File.ReadAllText($"{rootPath}source/{folder}/{path}.html");
    string Read(string path) => ReadComm(path, lang);

    string Join<E>(View view, IEnumerable<Entity<E>> xs) =>
        string.Join("\n", xs.Select(e => view.Run(e, e.Entry(lang)!)));

    View master = new(Read("master")), 
        newsCard = new(Read("news/card")), newsPage = new(Read("news/page")),
        projPage = new(Read("projects/page")), projCard = new(Read("projects/card"));

    string slides = Join(new(Read("slide")), slides_),
        payDetails = Read("partners-pay"),
        otherNews = Join(newsCard, news.Take(2)),

        topProjects = Join(projCard, projects.Take(5).Select((p, i) => i > 2 ? p with { MobOnly = true } : p));

    void Out(string content, string enPath, object? arg = null, string? uaPath = null)
    {
        if (content.Length < 30)
            content = Read(content);
        if (arg is not null)
            content = new View(content).Run(arg);

        uaPath ??= enPath;
        var path = $"{rootPath}/{lang}{(lang is "en" ? enPath : uaPath)}/index.html";
        
        new FileInfo(path).Directory!.Create();
        File.WriteAllText(path, master.Run(new { content, enPath, uaPath, version }));
    }

    var founders = new View(Read("founders")).Run(new
    {
        partners = Join(new(ReadComm("partner")), partners)
    });
    Out("index", "", new{ topProjects, payDetails, slides, founders });
    Out("center", "/center", new { payDetails, founders, skipAbout = true });
    Out("aboutus", "/aboutus", new { payDetails, founders });

    Out("thanks", "/thanks", new { content = Join(new(ReadComm("thankCard")), thanks) });

    foreach (var page in "about-diabetes contacts fun founding-documents".Split(' '))
        Out(page, "/" + page);

    Out("projects/index", "/fundraising", new { FundsList = Join(projCard, projects) });

    foreach (var proj in projects)
        if (Read("projects/" + proj.Id).Split("{{projDoc}}") is [var contentF, var contentS])
        {
            var args = new { contentF, contentS, report = proj.ReportId is { } id ? Read("projects/"+id) : null };
            Out(projPage.Run(args, proj, proj.Entry(lang)), "/fundraising/" + proj.Id);
        }
    
    Out("news/index", "/news", new { Cards = Join(newsCard, news) });

    foreach (var nw in news)
    {
        var loc = nw.Entry(lang);
        var content = Read("news/" + loc.Id);
        Out(newsPage.Run(nw, loc), "/news/"+nw.En.Id, new { otherNews, content }, "/news/"+nw.Ua.Id);
    }
}

record Entity<TEntry>()
{
    public required TEntry En { get; init; }
    public required TEntry Ua { get; init; }
    public string? Pic { get; init; }

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

record ProjEntry(string Data, string Signature, string Pdf): Entry;

record Proj(string Id, int Need, int Fund, bool IsMilitary, string? ReportId, bool MobOnly = false): Entity<ProjEntry>
{
    public int FundPerc => (int)((double)Fund / (double)Need * 100.0);
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };
    public bool IsFull => Need == Fund;
}

record Thanks(string? Avatar, int HRank) : Entity;

record Slide(string Mini, int Index, string Url) : Entity;