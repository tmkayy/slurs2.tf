namespace slurs2.backend.Services;

public record ScanProgress(int Processed, int Total, bool Done, bool Failed, bool Cancelled = false);

public class ScanProgressTracker
{
    private readonly Dictionary<string, ScanProgress> _scans = new();
    private readonly Dictionary<string, CancellationTokenSource> _cancellations = new();
    private readonly object _lock = new();

    public ScanProgress? Get(string steamId)
    {
        lock (_lock)
        {
            return _scans.GetValueOrDefault(steamId);
        }
    }

    //returns null if a scan for this player is already running.
    public CancellationToken? TryStart(string steamId)
    {
        lock (_lock)
        {
            if (_scans.TryGetValue(steamId, out var current) && !current.Done)
                return null;

            var cancellation = new CancellationTokenSource();
            _cancellations[steamId] = cancellation;
            _scans[steamId] = new ScanProgress(0, 0, false, false);
            return cancellation.Token;
        }
    }

    //returns false if there is no running scan to cancel.
    public bool Cancel(string steamId)
    {
        lock (_lock)
        {
            if (!_cancellations.TryGetValue(steamId, out var cancellation))
                return false;

            cancellation.Cancel();
            return true;
        }
    }

    public void SetTotal(string steamId, int total) =>
        Update(steamId, p => p with { Total = total });

    public void LogScanned(string steamId) =>
        Update(steamId, p => p with { Processed = p.Processed + 1 });

    public void Finish(string steamId, bool failed = false, bool cancelled = false)
    {
        Update(steamId, p => p with { Done = true, Failed = failed, Cancelled = cancelled });

        lock (_lock)
        {
            if (_cancellations.Remove(steamId, out var cancellation))
                cancellation.Dispose();
        }
    }

    private void Update(string steamId, Func<ScanProgress, ScanProgress> change)
    {
        lock (_lock)
        {
            if (_scans.TryGetValue(steamId, out var current))
                _scans[steamId] = change(current);
        }
    }
}
