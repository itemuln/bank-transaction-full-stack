"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Server, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          System configuration and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Authentication and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">JWT Access Token Expiry</span>
              <Badge variant="secondary">15 minutes</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">JWT Refresh Token Expiry</span>
              <Badge variant="secondary">7 days</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password Hashing Rounds</span>
              <Badge variant="secondary">12 (bcrypt)</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Max Login Attempts</span>
              <Badge variant="secondary">5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
            <CardDescription>
              API rate limit configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Global Rate Limit</span>
              <Badge variant="secondary">100 req / 15 min</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Login Rate Limit</span>
              <Badge variant="secondary">5 req / 15 min</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Banking Configuration
            </CardTitle>
            <CardDescription>
              Transaction thresholds and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Large Transaction Threshold</span>
              <Badge variant="secondary">$10,000</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Requires Approval Above Threshold</span>
              <Badge variant="secondary">Yes</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fraud Detection</span>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
