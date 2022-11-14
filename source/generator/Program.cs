using System.Text.Json;

var rootPath = Environment.CurrentDirectory.Split("source")[0];

T[] LoadJson<T>(string subp) => JsonSerializer.Deserialize<T[]>(File.ReadAllText($"{rootPath}source/{subp}.json"))!;

var version = 21;
var projects = LoadJson<Proj>("projects");
var news = LoadJson<News>("news");
var partners_ = LoadJson<Partner>("partners");
var thanks = LoadJson<Thanks>("thanks");
var slides_ = LoadJson<Slide>("slides");

Render("ua");
Render("en");

void Render(string lang)
{
    string ReadComm(string path) => File.ReadAllText($"{rootPath}source/{path}.html");
    string Read(string path) => ReadComm(lang+ "/" +path);

    string Join<E>(View view, IEnumerable<Entity<E>> xs) =>
        string.Join("\n", xs.Select(entity => view.Run(entity, entity.Entry(lang)!)));

    View master = new(Read("master")),
        newsCard = new(Read("news/card")),
        newsPage = new(Read("news/page")),
        projPage = new(Read("projects/page")),
        projCard = new(Read("projects/card"));

    string payDetails = Read("partners-pay"),
        slides = Join(new(Read("slide")), slides_),
        otherNews = Join(newsCard, news.Take(2)),
        topProjects = Join(projCard, projects.Take(3)),
        partners = Join(new(ReadComm("partner")), partners_),
        founders = new View(Read("founders")).Run(new { partners });

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

    Out("index", "", new{ topProjects, payDetails, slides, founders });
    Out("center", "/center", new { payDetails, founders, skipAbout = true });
    Out("aboutus", "/aboutus", new { payDetails, founders });

    Out("thanks", "/thanks", new { content = Join(new(ReadComm("thankCard")), thanks) });

    foreach (var page in "about-diabetes contacts fun founding-documents".Split(' '))
        Out(page, "/" + page);

    Out("projects/index", "/fundraising", new { FundsList = Join(projCard, projects) });

    foreach (var proj in projects)
        Out(projPage.Run(new { Content = Read("projects/" + proj.Id) }, proj, proj.Entry(lang)),
            "/fundraising/" + proj.Id);
    
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
    public TEntry Entry(string lang) => lang is "en" ? En : Ua;
}
record Entity : Entity<Entry>;

record Entry
{
    public required string Title { get; init; }
    public string? Descr { get; init; }
}

record NewsEntry(string Id) : Entry;
record News(string Image, string Date) : Entity<NewsEntry>;

record ProjEntry(string Data, string Signature, string Pdf, string? Report): Entry;

record Proj(string Id, string Image, int Need, int Fund, bool IsMilitary, string? ReportImage): Entity<ProjEntry>
{
    public int FundPerc => (int)((double)Fund / (double)Need * 100.0);
    public int Fullness => FundPerc switch { > 80 => 3, > 30 => 2, _ => 1 };
    public bool IsFull => Need == Fund;
}

record Partner(string Pic) : Entity;

record Thanks(string? Pic, string? Avatar, int HRank) : Entity
{
    public bool HideAvatar => Avatar is null;
    public bool HidePic => Pic is null;
}

record Slide(string Pic, string Mini, int Index, string Url) : Entity;