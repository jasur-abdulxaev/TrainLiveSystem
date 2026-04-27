namespace Poyezd.Domain;

public class SimulationRequest
{
    public Route Route { get; set; } = new();
    public List<PassengerFlow> Flows { get; set; } = new();
    public BusParameters Bus { get; set; } = new();
}

public class BusParameters
{
    public int Capacity { get; set; }
    public double Gamma { get; set; }
    public double SpeedKmH { get; set; }
    public int StopTimeSeconds { get; set; }
}

public class SimulationResponse
{
    public List<HourlyBusCount> HourlyBusCounts { get; set; } = new();
    public Schedule Schedule { get; set; } = new();
    
    // Advanced Analytics
    public AnalyticsSummary Analytics { get; set; } = new();
}

public class AnalyticsSummary
{
    public double TotalMileageKm { get; set; }
    public int TotalPassengers { get; set; }
    public int MaxRequiredBuses { get; set; }
    public string PeakHour { get; set; } = string.Empty;
    public double AvgEfficiency { get; set; }
    public int TotalTripsGenerated { get; set; }
    public double SystemReliability { get; set; } = 98.5; // Estimated
}

public class HourlyBusCount
{
    public string TimePeriod { get; set; } = string.Empty;
    public int RequiredBuses { get; set; }
    public int PassengerCount { get; set; }
}
