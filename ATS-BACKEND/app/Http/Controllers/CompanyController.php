<?php

namespace App\Http\Controllers;

use App\Http\Resources\CompanyResource;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CompanyController extends Controller
{
    public function index()
    {
        return CompanyResource::collection(Company::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:companies,name'],
        ]);

        $company = Company::create($data);

        return (new CompanyResource($company))->response()->setStatusCode(201);
    }

    public function show(Company $company)
    {
        return new CompanyResource($company);
    }

    public function update(Request $request, Company $company)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:companies,name,'.$company->id],
        ]);

        $company->update($data);

        return new CompanyResource($company);
    }

    public function destroy(Company $company): Response
    {
        $company->delete();

        return response()->noContent();
    }

    public function assignUser(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $company->users()->syncWithoutDetaching([$data['user_id']]);

        return response()->json(['message' => 'User assigned to company successfully']);
    }

    public function removeUser(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $company->users()->detach($data['user_id']);

        return response()->json(['message' => 'User removed from company successfully']);
    }
}
