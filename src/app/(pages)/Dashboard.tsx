"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Activity } from "lucide-react";
import toast from "react-hot-toast";

export function Dashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [stats, setStats] = useState({
    revenue: "$0.00",
    users: 0,
    requests: 0,
    activeNow: 0,
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/stats.php");
      if (res.ok) {
        const data = await res.json();
        setTrafficData(data.trafficData);
        setRequests(data.recentRequests);
        setUsers(data.recentUsers);
        setStats(data.aggregates);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    id: number,
    email: string | undefined,
    action: "Accepted" | "Denied",
  ) => {
    if (actionLoadingId !== null) return; // prevent double click

    try {
      if (!email) {
        toast.error("Request is missing user email. Cannot safely upgrade.");
        return;
      }

      setActionLoadingId(id);

      const res = await fetch(`/api/dashboard/requests/update.php?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, email }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("API error:", result);
        throw new Error(result.message || "Failed to update request");
      }

      await fetchData();

      toast.success(
        action === "Accepted"
          ? "Request Accepted & Credits Added"
          : "Request Denied",
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
        Admin Dashboard
      </h2>

      {/* Traffic Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={stats.revenue.replace("$", "₹")}
          change="+20.1% from last month"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Users"
          value={`+${stats.users}`}
          change="+180.1% from last month"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Plan Requests"
          value={`+${stats.requests}`}
          change="+19% from last month"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Monthly Income Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Income Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number) => [`₹${value}`, "Income"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />

                <Bar dataKey="income" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {user.phone_no && (
                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {user.phone_no}
                      </span>
                    )}
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    <div>{req.user}</div>
                    <div className="text-xs text-gray-400">{req.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {req.phone_no || "N/A"}
                  </TableCell>
                  <TableCell>{req.plan}</TableCell>
                  <TableCell className="font-mono text-sm">{req.amount}</TableCell>
                  <TableCell>{req.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.status === "Accepted"
                          ? "default"
                          : req.status === "Denied"
                            ? "destructive"
                            : "outline"
                      }
                      className={
                        req.status === "Accepted"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {req.status === "Pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === req.id}
                          className={`text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 ${
                            actionLoadingId === req.id
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() =>
                            handleAction(req.id, req.email, "Accepted")
                          }
                        >
                          {actionLoadingId === req.id
                            ? "Processing..."
                            : "Accept"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === req.id}
                          className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${
                            actionLoadingId === req.id
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={() =>
                            handleAction(req.id, req.email, "Denied")
                          }
                        >
                          {actionLoadingId === req.id
                            ? "Processing..."
                            : "Deny"}
                        </Button>
                      </>
                    )}
                    {req.status !== "Pending" && (
                      <span className="text-xs text-gray-500">No actions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
