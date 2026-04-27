namespace Poyezd.Domain;

public class Route
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Stop> Stops { get; set; } = new();
}
