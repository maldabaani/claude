import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';

class LoadingShimmer extends StatelessWidget {
  final int count;
  final double height;
  const LoadingShimmer({super.key, this.count = 3, this.height = 100});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(count, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Shimmer.fromColors(
          baseColor: AppColors.surfaceVariant,
          highlightColor: AppColors.border,
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      )),
    );
  }
}
