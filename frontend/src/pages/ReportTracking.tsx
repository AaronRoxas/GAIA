/**
 * Report Tracking Page
 * Module: CR-08 (implied extension)
 * 
 * Allows users to check the status of their submitted report using tracking ID
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle, Clock, XCircle, AlertTriangle, MapPin, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { HazardIcon, getHazardIcon } from '../constants/hazard-icons';
import { API_BASE_URL } from '../lib/api';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';
import { ThemeToggle } from '../components/ThemeToggle';

/**
 * ReportTrackingDetailsSkeleton - Mimics the report details card while loading
 */
const ReportTrackingDetailsSkeleton = () => (
  <Card className="p-8 shadow-xl">
    {/* Status Badge */}
    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 mb-6">
      <Skeleton className="h-10 w-40 rounded-md" />
      <div className="text-left sm:text-right space-y-1">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-5 w-32 rounded-md" />
      </div>
    </div>

    {/* Report Details Grid */}
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        </div>
      ))}
    </div>

    {/* Description */}
    <div className="mb-6 space-y-2">
      <Skeleton className="h-6 w-32 rounded-md" />
      <Skeleton className="h-20 w-full rounded-md" />
    </div>

    {/* Verified Date */}
    <Skeleton className="h-16 w-full rounded-md mb-6" />

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
      <Skeleton className="flex-1 h-12 rounded-md" />
      <Skeleton className="flex-1 h-12 rounded-md" />
    </div>
  </Card>
);

/**
 * ReportTrackingHelpSkeleton - Mimics the help section while loading
 */
const ReportTrackingHelpSkeleton = () => (
  <Card
    className={cn(
      'p-6 border-2 shadow-sm',
      'border-primary/20 bg-gradient-to-br from-secondary/[0.12] via-primary/[0.05] to-card',
      'dark:border-primary/45 dark:from-primary/25 dark:via-primary/12 dark:to-secondary/15 dark:shadow-md dark:shadow-black/20'
    )}
  >
    <Skeleton className="h-6 w-32 mb-3 rounded-md" />
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-4 w-full rounded-md" />
      ))}
    </div>
  </Card>
);

interface ReportStatus {
  tracking_id: string;
  status: string;
  hazard_type: string;
  location_name: string;
  description: string;
  submitted_at: string;
  verified_at?: string;
  confidence_score: number;
  notes?: string;
}

/**
 * Render the report-tracking UI allowing a user to enter a tracking ID and view the status and details of a submitted hazard report.
 *
 * Displays a search form for a tracking ID, shows loading and error states, and conditionally renders a detailed report card (status badge, metadata, description, verification and notes, and action links) when a report is found. When no report is present, shows help guidance.
 *
 * @returns A React element containing the tracking form, conditional report details, and help content
 */
export function ReportTracking() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [trackingId, setTrackingId] = useState(initialId);
  const [submittedTrackingId, setSubmittedTrackingId] = useState('');

  // Auto-trigger search when a tracking ID is present in the URL on mount
  useEffect(() => {
    if (initialId) {
      setSubmittedTrackingId(initialId);
    }
  }, [initialId]);

  const {
    data: report,
    isFetching,
    isError,
    error,
  } = useQuery<ReportStatus>({
    queryKey: ['report-tracking', submittedTrackingId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/citizen-reports/track/${submittedTrackingId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found. Please check your tracking ID.');
        }
        throw new Error('Failed to retrieve report status');
      }
      return response.json();
    },
    enabled: !!submittedTrackingId,
    staleTime: 60_000,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setSubmittedTrackingId(trackingId.trim());
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; hover: string }> = {
      pending_verification: {
        label: 'Pending Verification',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="w-4 h-4" />,
        hover: 'hover:bg-yellow-200'
      },
      verified: {
        label: 'Verified',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
        hover: 'hover:bg-green-200'
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle className="w-4 h-4" />,
        hover: 'hover:bg-red-200'
      },
      under_review: {
        label: 'Under Review',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <AlertTriangle className="w-4 h-4" />,
        hover: 'hover:bg-blue-200'
      }
    };

    const config = statusConfig[status] || statusConfig.pending_verification;

    return (
      <Badge className={`${config.color} border-2 px-4 py-2 text-sm font-semibold flex items-center gap-2 ${config.hover}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    }).format(date);
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.7) return { label: 'High', color: 'text-green-600' };
    if (score >= 0.4) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  return (
    <div className=" min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle className="text-foreground shrink-0 hover:bg-secondary" />
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Track Your Report
          </h1>
          <p className="text-lg text-muted-foreground">
            Enter your tracking ID to check the status of your hazard report
          </p>
        </div>

        {/* Search Card */}
        <Card className="p-6 mb-8 shadow-lg">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="tracking-id" className="block text-sm font-medium dark:text-white text-gray-700 mb-2">
                Tracking ID
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Input
                  id="tracking-id"
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="CR20241102ABCD1234"
                  className="flex-1 font-mono text-base h-12"
                  disabled={isFetching}
                />
                <Button
                  type="submit"
                  disabled={isFetching || !trackingId.trim()}
                  size="lg"
                  className="w-full sm:w-auto px-8"
                >
                  {isFetching ? (
                    <>
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error instanceof Error ? error.message : 'An error occurred'}</p>
              </div>
            )}
          </form>
        </Card>

        {/* Report Details - Show skeleton while fetching, then actual report */}
        {isFetching && submittedTrackingId && <ReportTrackingDetailsSkeleton />}
        {!isFetching && report && (
          <Card className="p-8 shadow-xl animate-fade-in">
            {/* Status Badge */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 mb-6">
              {getStatusBadge(report.status)}
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking ID</p>
                <code className="text-sm font-mono font-semibold dark:text-white text-gray-900">{report.tracking_id}</code>
              </div>
            </div>

            {/* Report Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Hazard Type */}
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: getHazardIcon(report.hazard_type).bgColor }}
                >
                  <HazardIcon 
                    hazardType={report.hazard_type} 
                    size={20} 
                    useHazardColor 
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hazard Type</p>
                  <p className="font-semibold dark:text-white text-gray-900 capitalize">{report.hazard_type.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-semibold dark:text-white text-gray-900">{report.location_name}</p>
                </div>
              </div>

              {/* Submitted Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                  <p className="font-semibold dark:text-white text-gray-900">{formatDate(report.submitted_at)}</p>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence Level</p>
                  <p className={`font-semibold dark:text-white ${getConfidenceLevel(report.confidence_score).color}`}>
                    {getConfidenceLevel(report.confidence_score).label} ({Math.round(report.confidence_score * 100)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">Description</h3>
              <p className="text-sm dark:text-white text-gray-800 whitespace-pre-line">{report.description}</p>
            </div>

            {/* Verified Date (if applicable) */}
            {report.verified_at && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Verified on:</strong> {formatDate(report.verified_at)}
                </p>
              </div>
            )}

            {/* Notes */}
            {report.notes && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Notes from Authorities</p>
                <p className="text-sm text-gray-800">{report.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Link to="/map" className="flex-1">
                <Button variant="outline" className="w-full hover:bg-secondary" size="lg">
                  View on Hazard Map
                </Button>
              </Link>
              <Link to="/report" className="flex-1">
                <Button variant="default" className="w-full" size="lg">
                  Submit Another Report
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Help Section */}
        {submittedTrackingId && isFetching && <ReportTrackingHelpSkeleton />}
        {!report && !isFetching && !submittedTrackingId && (
          <Card
            className={cn(
              'p-6 border-2 shadow-sm',
              // Light: soft brand-tinted panel on top of page background
              'border-primary/20 bg-gradient-to-br from-secondary/[0.12] via-primary/[0.05] to-card',
              // Dark: deeper informational surface, readable on charcoal
              'dark:border-primary/45 dark:from-primary/25 dark:via-primary/12 dark:to-secondary/15 dark:shadow-md dark:shadow-black/20'
            )}
          >
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 shrink-0 text-secondary dark:text-sky-400" aria-hidden />
              Need Help?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-secondary dark:text-sky-400" aria-hidden>
                  •
                </span>
                Make sure you entered the tracking ID exactly as it was provided
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-secondary dark:text-sky-400" aria-hidden>
                  •
                </span>
                Tracking IDs are case-sensitive and start with &ldquo;CR&rdquo; followed by date and unique code
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-secondary dark:text-sky-400" aria-hidden>
                  •
                </span>
                If you lost your tracking ID, you cannot retrieve it. Please submit a new report.
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ReportTracking;
