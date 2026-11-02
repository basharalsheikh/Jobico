<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FooterSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = FooterSetting::firstOrCreate([]);

        if (! $settings) {
            return response()->json([
                'message' => 'Footer settings have not been configured.',
            ], 404);
        }

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $settings = FooterSetting::first();

        if (! $settings) {
            return response()->json([
                'message' => 'Footer settings have not been configured.',
            ], 404);
        }

        $validated = $request->validate([
            'company_name' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'subtitle' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
            'phones' => [
                'sometimes',
                'nullable',
                'array',
            ],
            'phones.*.label' => [
                'required_with:phones',
                'string',
                'max:100',
            ],
            'phones.*.value' => [
                'required_with:phones',
                'string',
                'max:50',
            ],
            'phones.*.is_visible' => [
                'required_with:phones',
                'boolean',
            ],
            'emails' => [
                'sometimes',
                'nullable',
                'array',
            ],
            'emails.*.label' => [
                'required_with:emails',
                'string',
                'max:100',
            ],
            'emails.*.value' => [
                'required_with:emails',
                'email',
                'max:255',
            ],
            'emails.*.is_visible' => [
                'required_with:emails',
                'boolean',
            ],
            'cta_title' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'cta_line_1' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'cta_line_2' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'cta_button_text' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],
            'copyright_text' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
        ]);

        $settings->fill($validated);
        $settings->save();

        return response()->json([
            'message' => 'Footer settings updated successfully.',
            'data' => $settings->fresh(),
        ]);
    }
}
