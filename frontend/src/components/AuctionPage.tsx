import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const auctionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    starting_price: z.number().min(0, 'Starting price must be positive'),
    end_price: z.number().optional(),
    status: z.string().min(1, 'Status is required'),
    ends_at: z.string().min(1, 'End date is required'),
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

interface Auction {
    _id?: string;
    title: string;
    description: string;
    starting_price: number;
    end_price?: number;
    status: string;
    ends_at: string;
    owner: string;
}

export function AuctionPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();

    const form = useForm<AuctionFormValues>({
        resolver: zodResolver(auctionSchema),
        defaultValues: {
            title: "",
            description: "",
            starting_price: 0,
            end_price: undefined,
            status: "active",
            ends_at: "",
        }
    });

    const token = localStorage.getItem('token');    const fetchAuctions = async () => {
        try {
            const response = await fetch('http://localhost:4005/auctions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAuctions(data);
            } else {
                console.log('Failed to fetch auctions');
            }
        } catch (error) {
            console.log('Auctions endpoint error:', error);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    const onSubmit = async (data: AuctionFormValues) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('http://localhost:4005/auction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create auction');
            }

            setSuccess('Auction created successfully!');
            form.reset();
            setIsDialogOpen(false);

            // Refresh the auctions list instead of trying to add locally
            await fetchAuctions();

        } catch (err: any) {
            setError(err.message || 'Failed to create auction');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Auctions</h1>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Create New Auction</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create New Auction</DialogTitle>
                            </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {success && (
                                    <Alert>
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                )}

                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter auction title"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter auction description"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="starting_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Starting Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="end_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Price (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="active, pending, ended"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ends_at"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="datetime-local"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Auction'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
                </div>
            </div>

            {auctions.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">
                            No auctions available yet. Create your first auction!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctions.map((auction, index) => (
                        <Card key={auction._id || index}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{auction.title}</CardTitle>
                                    <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
                                        {auction.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-3">{auction.description}</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Starting Price:</span>
                                        <span>{formatPrice(auction.starting_price)}</span>
                                    </div>
                                    {auction.end_price && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">End Price:</span>
                                            <span>{formatPrice(auction.end_price)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="font-medium">Owner ID:</span>
                                        <span>{auction.owner}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Ends:</span>
                                        <span>{formatDate(auction.ends_at)}</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate(`/auction/${auction._id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
