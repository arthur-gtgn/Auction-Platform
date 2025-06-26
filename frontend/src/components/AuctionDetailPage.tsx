import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

const auctionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    starting_price: z.string().min(1, 'Starting price is required'),
    end_price: z.string().optional(),
    status: z.string().min(1, 'Status is required'),
    ends_at: z.string().min(1, 'End date is required'),
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

interface Auction {
    _id: string;
    title: string;
    description: string;
    starting_price: number;
    end_price?: number;
    status: string;
    ends_at: string;
    owner: string;
}

export function AuctionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const token = localStorage.getItem('token');

    const form = useForm<AuctionFormValues>({
        resolver: zodResolver(auctionSchema),
        defaultValues: {
            title: "",
            description: "",
            starting_price: "0",
            end_price: "",
            status: "",
            ends_at: "",
        }
    });

    const fetchAuction = async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:4005/auction/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch auction');
            }

            const auctionData = await response.json();
            setAuction(auctionData);

            // Set form values
            form.reset({
                title: auctionData.title,
                description: auctionData.description,
                starting_price: auctionData.starting_price.toString(),
                end_price: auctionData.end_price ? auctionData.end_price.toString() : "",
                status: auctionData.status,
                ends_at: auctionData.ends_at.split('T')[0] + 'T' + auctionData.ends_at.split('T')[1]?.split('.')[0] || '',
            });

        } catch (err: any) {
            setError(err.message || 'Failed to fetch auction');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuction();
    }, [id]);

    const onSubmit = async (data: AuctionFormValues) => {
        if (!id) return;

        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            // Transform data to ensure correct types
            const transformedData = {
                ...data,
                starting_price: parseFloat(data.starting_price),
                end_price: data.end_price && data.end_price.trim() !== '' ? parseFloat(data.end_price) : undefined,
            };

            const response = await fetch(`http://localhost:4005/auction/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transformedData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update auction');
            }

            setSuccess('Auction updated successfully!');
            setIsEditing(false);
            await fetchAuction(); // Refresh data

        } catch (err: any) {
            setError(err.message || 'Failed to update auction');
        } finally {
            setIsUpdating(false);
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

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-center">
                    <p>Loading auction...</p>
                </div>
            </div>
        );
    }

    if (error && !auction) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="outline" onClick={() => navigate('/auctions')}>
                        Back to Auctions
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <Button variant="outline" onClick={() => navigate('/auctions')}>
                    Back to Auctions
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl">
                            {isEditing ? 'Edit Auction' : auction?.title}
                        </CardTitle>
                        <div className="flex gap-2">
                            {auction && (
                                <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
                                    {auction.status}
                                </Badge>
                            )}
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                    disabled={isUpdating}
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
                                                    disabled={isUpdating}
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
                                                    disabled={isUpdating}
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
                                                    disabled={isUpdating}
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
                                                    disabled={isUpdating}
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
                                                    disabled={isUpdating}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={isUpdating}>
                                        {isUpdating ? 'Updating...' : 'Update Auction'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    ) : (
                        auction && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Description</h3>
                                    <p className="text-gray-600">{auction.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium">Starting Price</h4>
                                        <p>{formatPrice(auction.starting_price)}</p>
                                    </div>
                                    {auction.end_price && (
                                        <div>
                                            <h4 className="font-medium">End Price</h4>
                                            <p>{formatPrice(auction.end_price)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-medium">Owner ID</h4>
                                        <p>{auction.owner}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Ends At</h4>
                                        <p>{formatDate(auction.ends_at)}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
