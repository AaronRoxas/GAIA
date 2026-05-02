/**
 * Report Confirmation Page
 * Module: CR-07
 * 
 * Displays thank you message and tracking ID after successful submission
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, ArrowRight, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ThemeToggle } from '../components/ThemeToggle';

/**
 * Render the report submission confirmation view.
 *
 * Displays a thank-you page with the report's tracking ID, copy-to-clipboard action, next-step guidance,
 * and navigation actions. If no `trackingId` is present in route parameters, renders an invalid confirmation
 * message with a link to submit a new report.
 *
 * @returns The confirmation page JSX; if `trackingId` is missing, a fallback invalid-page JSX prompting report submission.
 */
export function ReportConfirmation() {
  const { trackingId } = useParams<{ trackingId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!trackingId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="fixed top-4 right-4 z-[100]">
          <ThemeToggle />
        </div>
        <Card className="max-w-md w-full p-8 text-center border-border bg-card">
          <p className="text-destructive font-semibold">Invalid confirmation page</p>
          <Link to="/report" className="text-secondary hover:underline mt-4 block font-medium">
            Submit a new report
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="flex justify-center mb-8 animate-bounce-slow">
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-500 dark:text-green-400" />
            <div className="absolute inset-0 w-24 h-24 bg-green-500 dark:bg-green-400 rounded-full opacity-20 animate-ping" />
          </div>
        </div>

        {/* Main Card */}
        <Card className="p-5 sm:p-8 md:p-12 shadow-xl bg-card text-card-foreground border-border">
          {/* Thank You Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Thank You for Your Report!
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Your hazard report has been successfully submitted and is now pending verification by authorities.
            </p>
            <Badge variant="secondary" className="text-sm">
              Status: Pending Verification
            </Badge>
          </div>

          {/* Tracking ID Section */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-6 mb-8 dark:border-primary/45 dark:bg-primary/15">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                  Your Tracking ID
                </h2>
                <p className="text-xs text-muted-foreground">
                  Save this ID to check your report status later
                </p>
              </div>
              <FileText className="w-5 h-5 text-primary shrink-0" aria-hidden />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0 overflow-hidden bg-background rounded-lg border-2 border-border px-4 py-3">
                <code className="text-sm sm:text-lg md:text-xl font-mono font-bold text-foreground tracking-wider break-all">
                  {trackingId}
                </code>
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="lg"
                className="flex-shrink-0"
              >
                <Copy className="w-5 h-5 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 dark:bg-muted/30 rounded-lg p-3 border border-border">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" aria-hidden />
              <p>
                <strong className="text-foreground">Important:</strong> This tracking ID is your only way to check the status of your report. 
                Please save it or take a screenshot for your records.
              </p>
            </div>
          </div>

          {/* What Happens Next Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/15 dark:bg-primary/25 rounded-full flex items-center justify-center">
                  <span className="dark:text-white text-primary font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Initial Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Your report will be reviewed by authorized validators who will verify the information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/15 dark:bg-primary/25 rounded-full flex items-center justify-center">
                  <span className="dark:text-white text-primary font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Verification Process</h3>
                  <p className="text-sm text-muted-foreground">
                    Authorities will assess the report&apos;s accuracy and relevance to ongoing hazard monitoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/15 dark:bg-primary/25 rounded-full flex items-center justify-center">
                  <span className="dark:text-white text-primary font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Status Update</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your tracking ID to check if your report has been verified and added to the system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate(`/track?id=${trackingId}`)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              Track This Report
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={() => navigate('/map')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              View Hazard Map
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              If you have urgent concerns or need immediate assistance, please contact your local 
              disaster risk reduction office or call the emergency hotline <strong className="text-foreground">911</strong>.
            </p>
          </div>
        </Card>

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <Link
            to="/report"
            className="text-secondary hover:underline font-medium"
          >
            Submit Another Report
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ReportConfirmation;
