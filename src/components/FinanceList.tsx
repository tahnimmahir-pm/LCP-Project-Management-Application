import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Check, X, FileText } from 'lucide-react';
import { Database } from '../lib/database.types';

type ExpenseClaim = Database['public']['Tables']['expense_claims']['Row'] & {
    user: { full_name: string };
    project: { title: string } | null;
};

interface FinanceListProps {
    onCreateClick: () => void;
}

export default function FinanceList({ onCreateClick }: FinanceListProps) {
    const { user } = useAuth();
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);
    const [loading, setLoading] = useState(true);
    // Default to Approvals tab if user is likely an approver
    const isApprover = user?.role === 'Manager' || user?.role === 'Super User' || user?.role === 'Finance' || (user as any)?.department === 'Finance';
    const [activeTab, setActiveTab] = useState<'my_claims' | 'approvals'>('my_claims');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // Update tab based on role once user is loaded
            const shouldBeApprovals = user.role === 'Manager' || user.role === 'Super User' || user.role === 'Finance' || (user as any)?.department === 'Finance';
            setActiveTab(shouldBeApprovals ? 'approvals' : 'my_claims');

            fetchClaims();
        }
    }, [user]);

    const fetchClaims = async () => {
        try {
            const { data, error } = await supabase
                .from('expense_claims')
                .select(`
          *,
          user:user_id(full_name),
          project:project_id(title)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClaims(data as any || []);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (claim: ExpenseClaim) => {
        if (!confirm('Approve this claim?')) return;
        setProcessing(claim.id);

        try {
            let nextStatus = 'APPROVED';
            // Determine next status based on current status
            // PENDING_MANAGER -> PENDING_FINANCE
            // PENDING_FINANCE -> PENDING_SUPERUSER
            // PENDING_SUPERUSER -> APPROVED

            if (claim.status === 'PENDING_MANAGER') nextStatus = 'PENDING_FINANCE';
            else if (claim.status === 'PENDING_FINANCE') nextStatus = 'PENDING_SUPERUSER';
            else if (claim.status === 'PENDING_SUPERUSER') nextStatus = 'APPROVED';

            const { error } = await supabase
                .from('expense_claims')
                .update({ status: nextStatus as any } as any)
                .eq('id', claim.id);

            if (error) throw error;
            fetchClaims();
        } catch (error) {
            alert('Error approving claim');
            console.error(error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (claim: ExpenseClaim) => {
        const reason = prompt('Enter rejection reason:');
        if (reason === null) return; // Cancelled

        setProcessing(claim.id);
        try {
            const { error } = await supabase
                .from('expense_claims')
                .update({ status: 'REJECTED', rejection_reason: reason } as any)
                .eq('id', claim.id);

            if (error) throw error;
            fetchClaims();
        } catch (error) {
            alert('Error rejecting claim');
            console.error(error);
        } finally {
            setProcessing(null);
        }
    };

    const myClaims = claims.filter(c => c.user_id === user?.id);
    const approvals = claims.filter(c => c.user_id !== user?.id && c.status !== 'DRAFT');

    const getStatusColor = (status: string) => {
        if (status === 'APPROVED') return 'bg-green-100 text-green-700';
        if (status === 'REJECTED') return 'bg-red-100 text-red-700';
        if (status.includes('PENDING')) return 'bg-yellow-100 text-yellow-700';
        return 'bg-gray-100 text-gray-700';
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading claims...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => setActiveTab('my_claims')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my_claims' ? 'bg-lcp-blue text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        My Claims
                    </button>
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-lcp-blue text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Approvals ({approvals.filter(c => !['APPROVED', 'REJECTED'].includes(c.status)).length})
                    </button>
                </div>

                {activeTab === 'my_claims' && (
                    <button
                        onClick={onCreateClick}
                        className="flex items-center gap-2 bg-lcp-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>New Claim</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-800">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-800">Title</th>
                                <th className="px-6 py-4 font-semibold text-gray-800">Category</th>
                                <th className="px-6 py-4 font-semibold text-gray-800">Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-800">Status</th>
                                {activeTab === 'approvals' && <th className="px-6 py-4 font-semibold text-gray-800">Requester</th>}
                                <th className="px-6 py-4 font-semibold text-gray-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(activeTab === 'my_claims' ? myClaims : approvals).map((claim) => (
                                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(claim.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{claim.title}</p>
                                        {claim.description && (
                                            <p className="text-xs text-gray-500 truncate max-w-xs">{claim.description}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{claim.category}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {claim.currency} {claim.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                                            {claim.status.replace(/_/g, ' ')}
                                        </span>
                                        {claim.rejection_reason && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Reason: {claim.rejection_reason}
                                            </div>
                                        )}
                                    </td>
                                    {activeTab === 'approvals' && (
                                        <td className="px-6 py-4 text-gray-600">
                                            {claim.user?.full_name}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {claim.receipt_url && (
                                                <a
                                                    href={claim.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                                    title="View Receipt"
                                                >
                                                    <FileText size={18} />
                                                </a>
                                            )}

                                            {activeTab === 'approvals' && !['APPROVED', 'REJECTED'].includes(claim.status) && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(claim)}
                                                        disabled={!!processing}
                                                        className="p-1 hover:bg-green-50 text-green-600 rounded"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(claim)}
                                                        disabled={!!processing}
                                                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {(activeTab === 'my_claims' ? myClaims : approvals).length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        No claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
