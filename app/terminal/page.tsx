"use client";

import { useState, useCallback, useRef } from "react";
import TerminalSim from "@/components/terminal-sim";

// ── Command reference data ──

type CmdInfo = {
  cmd: string;
  purpose: string;
  flags: string;
};

type CmdGroup = {
  title: string;
  cmds: CmdInfo[];
};

const COMMAND_GROUPS: CmdGroup[] = [
  {
    title: "System",
    cmds: [
      { cmd: "uptime", purpose: "Quick health check — load averages reveal if the node is overloaded or idle when it shouldn't be.", flags: "-p (pretty uptime), -s (since boot time)" },
      { cmd: "uname -a", purpose: "Verify kernel version — critical for GPU driver compatibility and debugging kernel panics.", flags: "-r (kernel release only), -m (architecture), -n (hostname)" },
      { cmd: "whoami", purpose: "Confirm you're running as the right user before making changes.", flags: "No common flags" },
      { cmd: "hostname", purpose: "Verify which node you're on — critical before running destructive operations.", flags: "-I (all IPs), -f (FQDN), -d (domain)" },
    ],
  },
  {
    title: "Memory & CPU",
    cmds: [
      { cmd: "free -h", purpose: "Check if memory is exhausted or swap is thrashing — common cause of training job OOMs.", flags: "-h (human sizes), -g (gigabytes), -s N (repeat every N sec), --si (use 1000 not 1024)" },
      { cmd: "dmidecode -t memory", purpose: "Get DIMM serial numbers, speeds, slots — required for RMA tickets and ECC error correlation.", flags: "-t memory (DIMMs), -t system (server model/serial), -t bios (firmware version), -t processor" },
      { cmd: "lscpu", purpose: "CPU topology — socket/core/thread counts, NUMA layout. Essential for diagnosing CPU-bound bottlenecks.", flags: "-e (extended table), -p (parseable), --all (include offline CPUs)" },
      { cmd: "cat /proc/cpuinfo | head -20", purpose: "Raw CPU details from the kernel — model name, MHz, cache size, flags. Useful when lscpu isn't available.", flags: "No flags — pipe through grep to filter (e.g., grep 'model name')" },
      { cmd: "top -bn1", purpose: "One-shot snapshot of processes, load, memory. Batch mode (-b) for scripting and log capture.", flags: "-bn1 (batch, 1 iteration), -o %CPU (sort field), -p PID (specific process), -H (show threads)" },
      { cmd: "vmstat", purpose: "Continuous system vital signs — CPU, memory, swap, I/O in one view. Spot patterns over time.", flags: "vmstat N (repeat every N sec), vmstat -s (summary stats), vmstat -d (disk stats)" },
    ],
  },
  {
    title: "Disk & Storage",
    cmds: [
      { cmd: "df -hT", purpose: "Check filesystem usage and types — catch full disks before they crash services.", flags: "-h (human), -T (fs type), -i (inodes), --total (grand total)" },
      { cmd: "lsblk -f", purpose: "Map block devices to filesystems and mount points — essential for identifying which disk is which.", flags: "-f (fs info), -o NAME,SIZE,TYPE (custom columns), -d (no partitions), -p (full paths)" },
      { cmd: "smartctl -a /dev/sda", purpose: "Predict disk failure — reallocated sectors and pending sectors are pre-fail indicators for RMA.", flags: "-a (all SMART data), -H (health only), -t short (run test), -l error (error log)" },
      { cmd: "mount", purpose: "List all mounted filesystems with their options — verify expected mounts are present and writable.", flags: "-t xfs (filter by type), -o remount,rw (remount), --bind (bind mount)" },
      { cmd: "iostat", purpose: "Identify disk I/O bottlenecks — high await or %util means storage is the chokepoint.", flags: "-x (extended stats), -z (skip idle), -d (disk only), -p (per partition), N M (interval, count)" },
      { cmd: "find /var -size +100M", purpose: "Hunt disk-space hogs — runaway logs are the #1 cause of full root partitions.", flags: "-size +100M (by size), -mmin -60 (modified recently), -name '*.log' (by name), -delete (remove matches)" },
    ],
  },
  {
    title: "GPU & Drivers",
    cmds: [
      { cmd: "nvidia-smi", purpose: "GPU health at a glance — temps, power, VRAM, utilization, ECC errors. First command for any GPU issue.", flags: "-l 1 (loop every 1s), -q (detailed query), --query-gpu=name,temp (CSV), -pm 1 (persistence mode)" },
      { cmd: "lspci", purpose: "Enumerate PCI devices — verify GPUs, NICs, NVMe controllers are detected. Missing device = hardware fault.", flags: "-v (verbose), -nn (vendor/device IDs), -k (kernel driver), -s 17:00.0 (specific slot)" },
      { cmd: "lsmod", purpose: "Verify kernel modules are loaded — nvidia, network drivers, NVMe. Missing module = driver issue.", flags: "No flags. Pair with modprobe to load, rmmod to unload, modinfo for details." },
    ],
  },
  {
    title: "BMC / IPMI",
    cmds: [
      { cmd: "ipmitool sensor list", purpose: "Read all BMC sensors — temps, fan RPMs, power draw, voltage. Catches thermal/power issues.", flags: "sensor list (all sensors), sensor get 'Inlet Temp' (specific sensor)" },
      { cmd: "ipmitool chassis status", purpose: "Check power state, intrusion, fan/drive faults — first command for a node that won't POST.", flags: "chassis status, chassis power on/off/cycle/reset" },
      { cmd: "ipmitool sel list", purpose: "System Event Log — historical record of hardware alerts. Correlate with dmesg for root cause.", flags: "sel list (all events), sel clear (reset log), sel info (log stats)" },
    ],
  },
  {
    title: "Network Config",
    cmds: [
      { cmd: "ip addr show", purpose: "List all interfaces with IPs — verify link state, correct IP assignment, MTU for jumbo frames.", flags: "addr show (all), addr show eth0 (specific), link set eth0 up/down, route show (routing table)" },
      { cmd: "ss -tlnp", purpose: "What's listening on which port — diagnose connectivity issues and verify services are bound correctly.", flags: "-t (TCP), -u (UDP), -l (listening), -n (numeric), -p (process), -a (all states)" },
      { cmd: "ethtool eth0", purpose: "NIC speed, duplex, link status — catch auto-negotiation failures and bad SFP modules.", flags: "ethtool eth0 (basic), -i (driver info), -S (NIC stats/errors), -k (offload features)" },
      { cmd: "nslookup", purpose: "Test DNS resolution — verify hostnames resolve to correct IPs. DNS failures cause cascading issues.", flags: "nslookup HOST, nslookup HOST SERVER (specific DNS), or use dig for more detail" },
    ],
  },
  {
    title: "Network Debug",
    cmds: [
      { cmd: "ping -c 3 10.42.15.1", purpose: "Basic connectivity test — first step in any network troubleshooting. Shows latency and packet loss.", flags: "-c N (count), -i N (interval), -s SIZE (packet size), -W N (timeout), -I eth0 (source interface)" },
      { cmd: "traceroute 10.42.15.1", purpose: "Map the path packets take — identify where in the network path traffic is being dropped or delayed.", flags: "-n (no DNS), -I (ICMP instead of UDP), -m N (max hops), -w N (wait timeout)" },
      { cmd: "tcpdump -c 5 -i eth0", purpose: "Packet-level capture — the definitive tool when you need to see exactly what's on the wire.", flags: "-c N (count), -i IFACE (interface), -w file.pcap (save), -n (no DNS), port 22 (filter by port)" },
      { cmd: "iptables -L -n", purpose: "View firewall rules — blocked ports are a common cause of 'connection refused' or timeouts.", flags: "-L (list), -n (numeric), -v (verbose/counters), -t nat (NAT table), --line-numbers" },
    ],
  },
  {
    title: "Processes & Services",
    cmds: [
      { cmd: "ps aux --sort=-%cpu", purpose: "Find CPU hogs — sort by CPU to identify runaway processes or confirm training workers are active.", flags: "aux (all users, verbose), --sort=-%cpu or -%mem, -eo pid,cmd (custom columns), -p PID (specific)" },
      { cmd: "systemctl status sshd", purpose: "Check if a service is running, when it started, recent logs. First command for any service issue.", flags: "status/start/stop/restart/enable/disable SERVICE, list-units --failed (broken services)" },
    ],
  },
  {
    title: "Logs & Debug",
    cmds: [
      { cmd: "dmesg -T | tail", purpose: "Recent kernel messages with timestamps — hardware errors, driver issues, OOM kills all show here.", flags: "-T (human timestamps), -l err (filter by level), --follow (live tail), -C (clear ring buffer)" },
      { cmd: "journalctl -b -p err", purpose: "All error+ messages since boot — filtered view of systemd journal. Catches service crashes and hardware events.", flags: "-b (this boot), -p err (priority), -u SERVICE (specific unit), -f (follow), --since '1 hour ago'" },
      { cmd: "lsof | grep deleted", purpose: "Find deleted files still held open — processes holding deleted logs can silently consume all disk space.", flags: "-i :PORT (by port), -u USER (by user), -p PID (by process), +D /path (by directory)" },
    ],
  },
];

const SIZE_PRESETS = [
  { label: "S", height: 160 },
  { label: "M", height: 240 },
  { label: "L", height: 360 },
  { label: "XL", height: 500 },
];

// ── Command Detail Panel ──

function CmdDetail({ info, onClose }: { info: CmdInfo; onClose: () => void }) {
  return (
    <div className="bg-forge-surface-2 border border-forge-accent/30 rounded-lg p-3 mb-2 animate-in fade-in duration-150">
      <div className="flex items-start justify-between gap-2 mb-2">
        <code className="mono text-xs text-green-400 font-bold">$ {info.cmd}</code>
        <button onClick={onClose} className="text-forge-text-muted hover:text-forge-text text-xs shrink-0">&times;</button>
      </div>
      <div className="text-[11px] text-forge-text-dim leading-relaxed mb-2">
        {info.purpose}
      </div>
      <div className="text-[10px] text-forge-text-muted">
        <span className="text-forge-accent-text/70 font-bold">FLAGS: </span>
        {info.flags}
      </div>
    </div>
  );
}

// ── Collapsible Group ──

function CommandGroupSection({
  group,
  selectedCmd,
  onSelectCmd,
  practiceMode,
  onTogglePractice,
  hitCmds,
}: {
  group: CmdGroup;
  selectedCmd: string | null;
  onSelectCmd: (cmd: string | null) => void;
  practiceMode: boolean;
  onTogglePractice: () => void;
  hitCmds: Set<string>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const total = group.cmds.length;
  const hitCount = group.cmds.filter((c) => hitCmds.has(c.cmd)).length;

  return (
    <div className="bg-forge-surface rounded-lg border border-forge-border overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-forge-surface-2 transition-colors"
      >
        <span className="text-forge-text-muted text-[10px] shrink-0">
          {collapsed ? "+" : "\u2212"}
        </span>
        <span className="mono text-[9px] text-forge-text-muted font-bold tracking-wider flex-1">
          {group.title.toUpperCase()}
        </span>
        <span className="mono text-[9px] text-forge-text-muted">
          {practiceMode ? `${hitCount}/` : ""}{total}
        </span>
      </button>

      {/* Commands list */}
      {!collapsed && (
        <div className="px-2.5 pb-2">
          {/* Selected command detail */}
          {selectedCmd && group.cmds.some((c) => c.cmd === selectedCmd) && (
            <CmdDetail
              info={group.cmds.find((c) => c.cmd === selectedCmd)!}
              onClose={() => onSelectCmd(null)}
            />
          )}

          {group.cmds.map((info) => {
            const isHit = hitCmds.has(info.cmd);
            const isSelected = selectedCmd === info.cmd;
            return (
              <button
                key={info.cmd}
                onClick={() => onSelectCmd(isSelected ? null : info.cmd)}
                className={`w-full text-left mono text-[10px] max-md:text-xs mb-0.5 px-1.5 py-0.5 max-md:min-h-[36px] rounded transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-forge-accent/10 text-green-400"
                    : "text-green-400/70 hover:bg-forge-surface-2 hover:text-green-400"
                }`}
              >
                {practiceMode && (
                  <span className={`shrink-0 text-[9px] ${isHit ? "text-green-400" : "text-forge-text-muted"}`}>
                    {isHit ? "\u2713" : "\u25CB"}
                  </span>
                )}
                <span className={`truncate ${practiceMode && isHit ? "line-through opacity-70" : ""}`}>
                  $ {info.cmd}
                </span>
              </button>
            );
          })}

          {/* Practice button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePractice();
            }}
            className={`mt-1.5 w-full mono text-[9px] px-2 py-1 rounded border transition-colors ${
              practiceMode
                ? "border-green-400/40 text-green-400 bg-green-400/10 hover:bg-green-400/20"
                : "border-forge-border text-forge-text-muted hover:border-forge-accent hover:text-forge-accent-text"
            }`}
          >
            {practiceMode
              ? hitCount === total
                ? "\u2713 All recalled!"
                : `Practicing... ${hitCount}/${total}`
              : "Practice"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function TerminalPage() {
  const [termHeight, setTermHeight] = useState(240);
  const [dragging, setDragging] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const [selectedCmd, setSelectedCmd] = useState<string | null>(null);
  const [practiceSections, setPracticeSections] = useState<Set<number>>(new Set());
  const [hitCmds, setHitCmds] = useState<Set<string>>(new Set());

  // All practiceable command strings across active sections
  const practiceTargets = new Set(
    COMMAND_GROUPS.flatMap((g, i) =>
      practiceSections.has(i) ? g.cmds.map((c) => c.cmd) : []
    )
  );

  const handleCommand = useCallback(
    (cmd: string) => {
      if (practiceTargets.size === 0) return;
      // Check exact match or if the typed command starts with a reference command
      for (const target of practiceTargets) {
        if (cmd === target || cmd.startsWith(target)) {
          setHitCmds((prev) => new Set(prev).add(target));
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [practiceSections]
  );

  const togglePractice = (idx: number) => {
    setPracticeSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        // Clear hits for this section
        const sectionCmds = new Set(COMMAND_GROUPS[idx].cmds.map((c) => c.cmd));
        setHitCmds((h) => {
          const nh = new Set(h);
          sectionCmds.forEach((c) => nh.delete(c));
          return nh;
        });
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);

    const startY = e.clientY;
    const startH = termHeight;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      setTermHeight(Math.max(120, Math.min(600, startH + delta)));
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [termHeight]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="mono text-xl font-bold text-green-400 mb-1">
              Terminal Simulator
            </h1>
            <p className="text-xs text-forge-text-dim">
              Simulated GPU node — type{" "}
              <code className="mono text-green-400 bg-forge-surface px-1 py-0.5 rounded text-[10px]">
                help
              </code>{" "}
              or click any command for details. Arrow keys for history.
            </p>
          </div>

          {/* Size presets */}
          <div className="flex items-center gap-1">
            <span className="mono text-[10px] text-forge-text-muted mr-1">SIZE</span>
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setTermHeight(p.height)}
                className="mono text-[10px] px-2 py-1 rounded transition-all"
                style={{
                  background: termHeight === p.height ? "rgba(34,197,94,0.15)" : "transparent",
                  color: termHeight === p.height ? "#22c55e" : "var(--color-v2-text-muted)",
                  border: `1px solid ${termHeight === p.height ? "rgba(34,197,94,0.3)" : "#222"}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-side layout */}
        <div className="flex gap-4 items-start">
          {/* Terminal */}
          <div className="flex-1 min-w-0" ref={termRef}>
            <TerminalSim height={termHeight} onCommand={handleCommand} />

            {/* Drag handle */}
            <div
              onMouseDown={onDragStart}
              className="h-2 flex items-center justify-center cursor-row-resize group"
            >
              <div
                className="w-12 h-0.5 rounded-full transition-colors"
                style={{ background: dragging ? "#22c55e" : "#333" }}
              />
            </div>
          </div>

          {/* Command reference sidebar */}
          <div className="w-64 shrink-0 hidden md:block">
            <div className="sticky top-4 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
              <div className="mono text-[9px] text-forge-text-muted font-bold tracking-widest mb-1">
                COMMAND REFERENCE
              </div>
              {COMMAND_GROUPS.map((group, idx) => (
                <CommandGroupSection
                  key={group.title}
                  group={group}
                  selectedCmd={selectedCmd}
                  onSelectCmd={setSelectedCmd}
                  practiceMode={practiceSections.has(idx)}
                  onTogglePractice={() => togglePractice(idx)}
                  hitCmds={hitCmds}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: command reference below */}
        <div className="mt-6 space-y-2 md:hidden">
          <div className="mono text-[9px] text-forge-text-muted font-bold tracking-widest mb-1">
            COMMAND REFERENCE
          </div>
          {COMMAND_GROUPS.map((group, idx) => (
            <CommandGroupSection
              key={group.title}
              group={group}
              selectedCmd={selectedCmd}
              onSelectCmd={setSelectedCmd}
              practiceMode={practiceSections.has(idx)}
              onTogglePractice={() => togglePractice(idx)}
              hitCmds={hitCmds}
            />
          ))}
        </div>
      </div>
    </>
  );
}
