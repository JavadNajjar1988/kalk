import React, { useState, Fragment } from 'react';
import { Box, Typography, IconButton, Collapse, Chip } from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
} from '@mui/icons-material';
import { MasterDefinition } from '../../types';
import { CategoryType } from '../../types';

interface DefinitionTreeViewProps {
	definitions: MasterDefinition[];
	onCreate: (data: any) => void;
	onUpdate: (id: string, data: any) => void;
	onDelete: (def: MasterDefinition) => void;
	onReorder: (items: MasterDefinition[]) => void;
	onAddChild?: (parentId: string) => void;
	getLevelName?: (level: number) => string;
	categoryType?: CategoryType;
}

interface TreeNodeProps {
	definition: MasterDefinition;
	depth?: number;
	onCreate: (data: any) => void;
	onUpdate: (id: string, data: any) => void;
	onDelete: (def: MasterDefinition) => void;
	onAddChild?: (parentId: string) => void;
	getLevelName?: (level: number) => string;
	categoryType?: CategoryType;
}

const TreeNodeMinimal: React.FC<TreeNodeProps> = ({
	definition,
	depth = 0,
	onCreate,
	onUpdate,
	onDelete,
	onAddChild,
	getLevelName,
	categoryType,
}) => {
	const [expanded, setExpanded] = useState<boolean>(depth < 1);
	const children = definition.children || [];
	const hasChildren = children.length > 0;

	const handleAddChild = () => {
		if (onAddChild) {
			onAddChild(definition.id);
		} else {
			onCreate({
				name: '',
				englishName: '',
				description: '',
				categoryId: definition.category.id,
				parentId: definition.id,
				level: (definition.level || 0) + 1,
				order: 0,
			});
		}
	};

	const handleEdit = () => {
		// باز کردن مودال ویرایش با داده‌های موجود
		onUpdate(definition.id, {
			name: definition.name,
			englishName: definition.englishName,
			description: definition.description,
			level: definition.level,
			parentId: definition.parentId,
			customFields: definition.customFields,
			metadata: definition.metadata,
		});
	};
	const handleDelete = () => onDelete(definition);

	const levelLabel = getLevelName ? getLevelName(definition.level || 0) : `سطح ${definition.level ?? ''}`;

	// تابع برای نمایش کدهای درجات نظامی
	const renderMilitaryRankCodes = () => {
		if (categoryType !== CategoryType.MILITARY_RANKS) return null;
		
		const customFields = definition.customFields || {};
		const codes = [];
		
		if (customFields.countryCode) {
			codes.push(
				<Chip 
					key="country" 
					size="small" 
					label={`[${customFields.countryCode}]`} 
					sx={{ height: 18, fontSize: '0.7rem', bgcolor: 'primary.light', color: 'primary.contrastText' }}
				/>
			);
		}
		
		if (customFields.groupCode) {
			codes.push(
				<Chip 
					key="group" 
					size="small" 
					label={`[${customFields.groupCode}]`} 
					sx={{ height: 18, fontSize: '0.7rem', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}
				/>
			);
		}
		
		if (customFields.rankCode) {
			codes.push(
				<Chip 
					key="rank" 
					size="small" 
					label={`[${customFields.rankCode}]`} 
					sx={{ height: 18, fontSize: '0.7rem', bgcolor: 'success.light', color: 'success.contrastText' }}
				/>
			);
		}
		
		return codes.length > 0 ? (
			<Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
				{codes}
			</Box>
		) : null;
	};

	return (
		<Box sx={{ mb: 1 }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 1,
					py: 0.75,
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 1,
					bgcolor: 'background.paper',
					ml: depth * 3,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
					{hasChildren ? (
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
							title={expanded ? 'بستن' : 'باز کردن'}
							sx={{ width: 24, height: 24 }}
						>
							{expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
						</IconButton>
					) : (
						<Box sx={{ width: 24, height: 24 }} />
					)}

					<Chip size="small" label={levelLabel} sx={{ height: 20 }} />

					<Typography variant="body2">{definition.name}</Typography>
					
					{/* نمایش کدهای درجات نظامی */}
					{renderMilitaryRankCodes()}
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<IconButton size="small" title="افزودن زیرمجموعه" onClick={(e) => { e.stopPropagation(); handleAddChild(); }}>
						<AddIcon fontSize="small" />
					</IconButton>
					<IconButton size="small" title="ویرایش" onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
						<EditIcon fontSize="small" />
					</IconButton>
					<IconButton size="small" title="حذف" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			{hasChildren && (
				<Collapse in={expanded} timeout="auto" unmountOnExit>
					<Box sx={{ mt: 0.75 }}>
						{children.map((child) => (
							<Fragment key={child.id}>
								<TreeNodeMinimal
									definition={child}
									depth={depth + 1}
									onCreate={onCreate}
									onUpdate={onUpdate}
									onDelete={onDelete}
									onAddChild={onAddChild}
									getLevelName={getLevelName}
									categoryType={categoryType}
								/>
							</Fragment>
						))}
					</Box>
				</Collapse>
			)}
		</Box>
	);
};

const DefinitionTreeViewMinimal: React.FC<DefinitionTreeViewProps> = ({
	definitions,
	onCreate,
	onUpdate,
	onDelete,
	onReorder,
	onAddChild,
	getLevelName,
	categoryType,
}) => {
	// فقط ریشه‌ها را نمایش بده و بازگشتی ادامه بده
	const rootDefinitions = definitions.filter((d) => !d.parentId);

	if (rootDefinitions.length === 0) {
		return (
			<Box sx={{ p: 3, textAlign: 'center' }}>
				<Typography variant="body2" color="text.secondary">هیچ تعریفی یافت نشد</Typography>
			</Box>
		);
	}

	return (
		<Box>
			{rootDefinitions.map((def) => (
				<TreeNodeMinimal
					key={def.id}
					definition={def}
					depth={0}
					onCreate={onCreate}
					onUpdate={onUpdate}
					onDelete={onDelete}
					onAddChild={onAddChild}
					getLevelName={getLevelName}
					categoryType={categoryType}
				/>
			))}
		</Box>
	);
};

export default DefinitionTreeViewMinimal;


